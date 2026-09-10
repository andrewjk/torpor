import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Nested KEYED `@for`s with updates on both levels: outer rows own deep
// descendant chains (item → inner list region → inner items), which is what
// the trailing-sibling capture and end-of-pass relink walks traverse.

const source = `
export default function ForNestedKeyed($props: {
	groups: Array<{ id: string, items: Array<{ id: number, label: string }> }>,
}) {
	@render {
		<div>
			@for (let g of $props.groups) {
				@key = g.id
				<section>
					<h2>{g.id}</h2>
					<ul>
						@for (let it of g.items) {
							@key = it.id
							<li>{it.label}</li>
						}
					</ul>
				</section>
			}
		</div>
		<footer>after</footer>
	}
}
`;

interface Inner {
	id: number;
	label: string;
}

interface Group {
	id: string;
	items: Inner[];
}

function structure(container: HTMLElement): Record<string, string[]> {
	const groups: Record<string, string[]> = {};
	for (const section of container.querySelectorAll("section")) {
		groups[section.querySelector("h2")?.textContent?.trim() ?? "?"] = Array.from(
			section.querySelectorAll("li"),
		).map((li) => li.textContent?.trim() || "");
	}
	return groups;
}

function run(container: HTMLElement, state: { groups: Group[] }) {
	expect(structure(container)).toEqual({ a: ["a1", "a2"], b: ["b1", "b2", "b3"] });

	// Inner-level update only: append to group a's items
	state.groups = state.groups.map((g) =>
		g.id === "a" ? { ...g, items: [...g.items, { id: 3, label: "a3" }] } : g,
	);
	assertRegionChain();
	expect(structure(container)).toEqual({ a: ["a1", "a2", "a3"], b: ["b1", "b2", "b3"] });

	// Inner-level reorder within one group
	state.groups = state.groups.map((g) =>
		g.id === "b" ? { ...g, items: [g.items[2]!, g.items[0]!, g.items[1]!] } : g,
	);
	assertRegionChain();
	expect(structure(container)).toEqual({ a: ["a1", "a2", "a3"], b: ["b3", "b1", "b2"] });

	// Outer-level reorder with rendered descendants
	state.groups = [...state.groups].reverse();
	assertRegionChain();
	expect(structure(container)).toEqual({ b: ["b3", "b1", "b2"], a: ["a1", "a2", "a3"] });

	// Mount a new group (outer mount with nested inner mounts)
	state.groups = [...state.groups, { id: "c", items: [{ id: 1, label: "c1" }] }];
	assertRegionChain();
	expect(structure(container)).toEqual({
		b: ["b3", "b1", "b2"],
		a: ["a1", "a2", "a3"],
		c: ["c1"],
	});

	// Replace a group wholesale (new key, nested clear + mount)
	state.groups = state.groups.map((g) =>
		g.id === "a" ? { id: "d", items: [{ id: 1, label: "d1" }] } : g,
	);
	assertRegionChain();
	expect(structure(container)).toEqual({
		b: ["b3", "b1", "b2"],
		d: ["d1"],
		c: ["c1"],
	});

	// Clear everything
	state.groups = [];
	assertRegionChain();
	expect(container.querySelectorAll("section").length).toBe(0);
	expect(container.querySelector("footer")).toHaveTextContent("after");
}

test("nested keyed for updates on both levels -- mounted", async () => {
	let $state = $watch({
		groups: [
			{
				id: "a",
				items: [
					{ id: 1, label: "a1" },
					{ id: 2, label: "a2" },
				],
			},
			{
				id: "b",
				items: [
					{ id: 1, label: "b1" },
					{ id: 2, label: "b2" },
					{ id: 3, label: "b3" },
				],
			},
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	run(container, $state);
});

test("nested keyed for updates on both levels -- hydrated", async () => {
	let $state = $watch({
		groups: [
			{
				id: "a",
				items: [
					{ id: 1, label: "a1" },
					{ id: 2, label: "a2" },
				],
			},
			{
				id: "b",
				items: [
					{ id: 1, label: "b1" },
					{ id: 2, label: "b2" },
					{ id: 3, label: "b3" },
				],
			},
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	run(container, $state);
});
