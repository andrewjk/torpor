import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `@for` body whose template has exactly one rendering root child (the
// `<li>`), with `@key` and `@const` siblings that produce no DOM. The
// compiler classifies the fragment as "single-root element" and emits the
// `t_fragment_el` / `t_root_el` / `t_add_element` path, which clones the
// cached template's `firstElementChild` directly into the parent — skipping
// the per-row `DocumentFragment` allocation that `getFragment` produces.
//
// The wrapping `<ul>` is *also* a single-root element fragment, so the
// top-level mount takes the new path too. These tests pin the runtime
// behaviour of that specialization: row events must still fire, region
// start/end nodes must be set correctly so the row can be cleared by
// `clearRegion`, and hydration must walk the existing DOM rather than
// re-inserting the cloned element.
const source = `
export default function ForSingleRoot($props: { items: Array<{ id: number, label: string }>, onSelect: (row: { id: number }) => void }) {
	@render {
		<ul>
			@for (let row of $props.items) {
				@key = row.id
				@const suffix = "!"
				<li>
					<span class="label">{row.label}{suffix}</span>
					<button class="select" onclick={() => $props.onSelect(row)}>select</button>
				</li>
			}
		</ul>
	}
}
`;

test("single-root for renders initial list -- mounted", async () => {
	const selected: number[] = [];
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
		onSelect: (row: { id: number }) => selected.push(row.id),
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const labels = Array.from(container.querySelectorAll(".label")).map(
		(el) => el.textContent?.trim() || "",
	);
	expect(labels).toEqual(["a!", "b!"]);

	// Stashed event listeners are attached during `addElement` via the shared
	// `runMountSideEffects` path — verify they actually fire.
	fireEvent.click(container.querySelector(".select")!);
	expect(selected).toEqual([1]);
});

test("single-root for clears rows cleanly across full replace", async () => {
	// `clearRegion` walks `region.startNode`/`region.endNode` to detach the
	// row's DOM nodes. With the single-root specialization both point at the
	// `<li>` itself (no `firstChild`/`lastChild` indirection), so this test
	// verifies that no orphan nodes survive a full replace / clear cycle.
	let nextId = 1;
	const $state = $watch({
		items: [] as Array<{ id: number; label: string }>,
		onSelect: () => {},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const build = (n: number) =>
		Array.from({ length: n }, () => ({ id: nextId++, label: `i${nextId}` }));

	$state.items = build(100);
	expect(container.querySelectorAll("li").length).toBe(100);

	// Full replace (all keys differ) — exercises the batch-clear + batch-create
	// fast path with the single-root createListItem.
	$state.items = build(100);
	expect(container.querySelectorAll("li").length).toBe(100);

	// Shrink to 0 — exercises pure clear.
	$state.items = [];
	expect(container.querySelectorAll("li").length).toBe(0);

	// Re-create after clear — verifies the cache + region chain are still usable.
	$state.items = build(50);
	expect(container.querySelectorAll("li").length).toBe(50);
});

test("single-root for updates matched rows when their data reference changes", async () => {
	// Combined with the no-proxy specialization (`@const` doesn't write to
	// for-vars, but `@const` alone keeps the body eligible), the
	// `updateListItem` callback re-runs row effects manually when a row's
	// reference changes. The single-root path doesn't change that — the
	// effect writes to the `<span>` it captured, which is still alive
	// because `addElement` set the region's start/end to the `<li>` that
	// contains it.
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
		onSelect: () => {},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = [
		{ id: 1, label: "A" },
		{ id: 2, label: "B" },
	];

	const labels = Array.from(container.querySelectorAll(".label")).map(
		(el) => el.textContent?.trim() || "",
	);
	expect(labels).toEqual(["A!", "B!"]);
});

test("single-root for renders initial list -- hydrated", async () => {
	// During hydration, `t_fragment_el`'s cloned element is discarded —
	// `nodeRootElement` walks the hydration cursor and returns the existing
	// DOM node instead. `addElement` then sets region.startNode/endNode to
	// that existing node (not the cloned one) and skips `insertBefore`.
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
		onSelect: (_row: { id: 0 }) => {},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const labels = Array.from(container.querySelectorAll(".label")).map(
		(el) => el.textContent?.trim() || "",
	);
	expect(labels).toEqual(["a!", "b!"]);

	// Stashed events should be wired up after hydration too.
	const selected: number[] = [];
	$state.onSelect = (row: { id: number }) => selected.push(row.id);
	fireEvent.click(container.querySelector(".select")!);
	expect(selected).toEqual([1]);
});
