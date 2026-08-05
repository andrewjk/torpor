import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `@for` body with no nested control statements — the compiler classifies
// it as "leaf-row safe" (via `isForBodyLeafSafe`) and emits a `createListItem`
// that skips the per-item `pushRegion(item)` / `popRegion(oldRegion)` calls.
// `runListItems` has already pushed the item onto the active region before
// calling `create()`, and a leaf body never creates descendant regions that
// would shift `context.activeRegion` away from the item — so the push/pop in
// the callback is purely redundant.
//
// These tests pin the runtime behaviour of that specialization: row effects
// must still land on the item's region (`context.activeRegion.effects`), row
// events must still fire, region start/end nodes must be set correctly so
// the row can be cleared by `clearRegion`, full replace / clear cycles must
// not leak nodes or subscriptions, and hydration must still walk the existing
// DOM rather than re-inserting the cloned element.
const source = `
export default function ForLeafRow($props: { items: Array<{ id: number, label: string }>, onSelect: (row: { id: number }) => void }) {
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

test("leaf-row for renders initial list -- mounted", async () => {
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

	// The create callback skipped `pushRegion(item)` / `popRegion(oldRegion)`,
	// so the only way these events fire is if the stashed-event flush during
	// `addElement`'s `runMountSideEffects` saw the correct `context.activeRegion`
	// (set by `runListItems`'s `pushRegion(item, true)`).
	fireEvent.click(container.querySelector(".select")!);
	expect(selected).toEqual([1]);
});

test("leaf-row for createListItem omits per-item pushRegion/popRegion", async () => {
	// Structural invariant: the leaf-row specialization's whole point is to
	// skip the per-item `t_push_region(item)` / `t_pop_region(oldRegion)`
	// calls in the createListItem callback. Verify by inspecting the
	// compiled client output — the same shape as the round-11 event-
	// delegation test that pinned `addEventListener` away via `vi.spyOn`,
	// but here we read the source directly because the runtime helpers
	// are default imports (bound at module load) and aren't reachable via
	// a vi.spyOn once the component has imported them.
	const $state = $watch({
		items: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, label: `r${i}` })),
		onSelect: () => {},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);
	expect(container.querySelectorAll("li").length).toBe(3);

	// Read the compiled output that `importComponent` just wrote to disk.
	// The createListItem is the second arrow-function argument to
	// `t_run_list`. The leaf-row specialization must NOT emit
	// `t_push_region(item)` or `t_pop_region(oldRegion)` inside it, while
	// the no-proxy `updateListItem` (the third arrow-function argument)
	// keeps its `t_rerun_region_effects` call.
	const tempDir = path.join(path.dirname(import.meta.filename), "components", "temp");
	const compiledName = fs.readdirSync(tempDir).find((f) => f.startsWith("ForLeafRow-client-"));
	expect(compiledName).toBeDefined();
	const compiled = fs.readFileSync(path.join(tempDir, compiledName!), "utf8");

	// `t_push_region` is not imported at all (no nested controls, no
	// per-item push/pop), and `t_rerun_region_effects` IS imported (the
	// no-proxy specialization still applies — the body is both leaf-safe
	// and no-proxy-safe).
	expect(compiled).not.toContain("t_push_region");
	expect(compiled).not.toContain("t_pop_region");
	expect(compiled).toContain("t_rerun_region_effects");
});

test("leaf-row for survives a full replace + clear cycle", async () => {
	// `clearRegion` walks `region.startNode` / `region.endNode` to detach
	// the row's DOM nodes and `releaseRegion` walks `region.effects` to
	// detach signal subscriptions. Both rely on `addElement` having set the
	// item's start/end nodes correctly and on the body's `$run` having
	// pushed its effect onto `item.effects` (via `context.activeRegion`).
	// This test runs several full-replace cycles to verify no nodes or
	// subscriptions leak when the create callback skips its own
	// push/pop.
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

	for (let round = 0; round < 5; round++) {
		$state.items = build(100);
		expect(container.querySelectorAll("li").length).toBe(100);

		// Full replace — every key differs, so this exercises the
		// batch-clear + batch-create fast path with the leaf-row
		// createListItem.
		$state.items = build(100);
		expect(container.querySelectorAll("li").length).toBe(100);

		// Shrink to 0 — exercises pure clear.
		$state.items = [];
		expect(container.querySelectorAll("li").length).toBe(0);
	}

	// Re-create after the cycles — verifies the cache + region chain are
	// still usable.
	$state.items = build(20);
	expect(container.querySelectorAll("li").length).toBe(20);
});

test("leaf-row for updates matched rows when their data reference changes", async () => {
	// The body's `$run` pushed its effect onto `item.effects` because
	// `context.activeRegion === item` (set by `runListItems`). When
	// `transferListItemData` runs the no-proxy `updateListItem`, the
	// reference-change check fires `t_rerun_region_effects(item)`, which
	// walks `item.effects` directly (no descendant regions to chase in the
	// leaf case). This test verifies that path still updates the DOM.
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

test("leaf-row for renders initial list -- hydrated", async () => {
	// During hydration, `t_fragment_el`'s cloned element is discarded —
	// `nodeRootElement` walks the hydration cursor and returns the existing
	// DOM node instead. `addElement` then sets region.startNode/endNode to
	// that existing node (not the cloned one) and skips `insertBefore`.
	// The leaf-row specialization doesn't change any of that — it only
	// removes the push/pop around it — so hydration must still produce the
	// right DOM, and stashed events must still be wired up.
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
	hydrateComponent(container, clientComponent, serverComponent, $state);

	const labels = Array.from(container.querySelectorAll(".label")).map(
		(el) => el.textContent?.trim() || "",
	);
	expect(labels).toEqual(["a!", "b!"]);

	const selected: number[] = [];
	$state.onSelect = (row: { id: number }) => selected.push(row.id);
	fireEvent.click(container.querySelector(".select")!);
	expect(selected).toEqual([1]);
});
