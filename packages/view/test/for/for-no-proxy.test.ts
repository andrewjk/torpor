import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `@for` body that only reads its loop variable — the compiler should
// classify this as "no-proxy safe" and emit the specialized `t_run_list`
// variant that skips the per-item shallow `$watch` Proxy around `data.row`.
// These tests pin the runtime behaviour of that specialization: row effects
// must still update when the underlying `data.row` reference is replaced
// (via the compiler-emitted `t_rerun_region_effects` callback), and rows
// whose data is unchanged must be left untouched.
const source = `
export default function ForNoProxy($props: { items: Array<{ id: number, label: string }> }) {
	@render {
		<ul>
			@for (let row of $props.items) {
				@key = row.id
				<li>{row.label}</li>
			}
		</ul>
	}
}
`;

function getLabels(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
}

test("no-proxy for renders initial list -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
			{ id: 3, label: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(getLabels(container)).toEqual(["a", "b", "c"]);
});

test("no-proxy for updates matched rows when their data reference changes", async () => {
	// Replacing an item with a *new object* (same key, new reference) is
	// exactly the path the no-proxy specialization has to handle manually:
	// without a Proxy on `data`, the assignment
	// `t_old_item.data.row = t_new_item.data.row` doesn't fire a signal, so
	// the compiler-emitted `updateListItem` must call
	// `t_rerun_region_effects(t_old_item)` to re-run the row's text effect.
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
			{ id: 3, label: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Replace every row's data with a brand new object.
	$state.items = [
		{ id: 1, label: "A" },
		{ id: 2, label: "B" },
		{ id: 3, label: "C" },
	];

	expect(getLabels(container)).toEqual(["A", "B", "C"]);
});

test("no-proxy for leaves matched rows untouched when their data is unchanged", async () => {
	// When the new list shares row-object references with the old list, the
	// compiler-emitted `updateListItem` early-outs on the reference-equality
	// check (`t_old_item.data.row !== t_new_item.data.row`) and skips the
	// effect re-run entirely. The DOM nodes must stay put.
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
			{ id: 3, label: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const initialLis = container.querySelectorAll("li");
	expect(initialLis.length).toBe(3);

	// Re-emit the same item objects in reversed order. The reconciler
	// re-uses the matched DOM nodes (keyed move) and the no-proxy
	// `updateListItem` skips effect re-runs because the references match.
	const a = $state.items[0];
	const b = $state.items[1];
	const c = $state.items[2];
	$state.items = [c, b, a];

	const reversedLis = container.querySelectorAll("li");
	expect(reversedLis.length).toBe(3);
	// Same DOM node references (keyed move, not re-create).
	expect(reversedLis[0]).toBe(initialLis[2]);
	expect(reversedLis[1]).toBe(initialLis[1]);
	expect(reversedLis[2]).toBe(initialLis[0]);
	expect(getLabels(container)).toEqual(["c", "b", "a"]);
});

test("no-proxy for updates matched rows across multiple reconciliations", async () => {
	// Regression for the original no-proxy bug: after the first
	// reconciliation, `listItems = newItems` meant later rounds couldn't
	// find the row effects (they were stranded on the original items).
	// `transferListItemData` now moves effects to the new item when no-proxy
	// is on, so updates on round N+1 still find them. This test runs several
	// rounds of reference-changing updates to pin that behaviour.
	let $state = $watch({
		items: [{ id: 1, label: "v1" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const li = () => container.querySelector("li")!.textContent!.trim();

	expect(li()).toBe("v1");

	$state.items = [{ id: 1, label: "v2" }];
	expect(li()).toBe("v2");

	$state.items = [{ id: 1, label: "v3" }];
	expect(li()).toBe("v3");

	$state.items = [{ id: 1, label: "v4" }];
	expect(li()).toBe("v4");
});

test("no-proxy for renders initial list -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(getLabels(container)).toEqual(["a", "b"]);
});
