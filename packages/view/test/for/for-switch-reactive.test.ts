import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A keyed `@for` over a reactive array with an inner `@switch` exercises the
// same runControl re-run / branch-switch paths as an inner `@if`, but with
// multiple branch indices — including switching between two content-bearing
// branches (clear old + push new at the chain tail) during a list update.

const source = `
export default function ForSwitchReactive($props: { items: Array<{ id: number, status: string }> }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@key = item.id
				@switch (item.status) {
					case "on": {
						<li class="on">{item.id}</li>
					}
					case "off": {
						<li class="off">{item.id}</li>
					}
					default: {
						<li class="unknown">{item.id}</li>
					}
				}
			}
		</ul>
		<footer>after</footer>
	}
}
`;

interface Item {
	id: number;
	status: string;
}

function render(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map(
		(li) => `${li.className}:${li.textContent?.trim()}`,
	);
}

function run(container: HTMLElement, state: { items: Item[] }) {
	// Switch between two content-bearing branches
	state.items = state.items.map((it) =>
		it.id === 1 ? { ...it, status: it.status === "on" ? "off" : "on" } : it,
	);
	assertRegionChain();
	expect(render(container)).toEqual(["off:1", "on:2", "on:3"]);

	// Switch to the default branch
	state.items = state.items.map((it) => (it.id === 2 ? { ...it, status: "?" } : it));
	assertRegionChain();
	expect(render(container)).toEqual(["off:1", "unknown:2", "on:3"]);

	// Toggle the switch condition while clearing rows
	state.items = [state.items[0]!];
	assertRegionChain();
	expect(render(container)).toEqual(["off:1"]);

	// Back to on, then clear all — no orphaned <li>s
	state.items = [{ id: 1, status: "on" }];
	assertRegionChain();
	expect(render(container)).toEqual(["on:1"]);

	state.items = [];
	assertRegionChain();
	expect(render(container)).toEqual([]);
	expect(container.querySelector("footer")).toHaveTextContent("after");
}

test("keyed for with inner switch updates branches without chain corruption -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, status: "on" },
			{ id: 2, status: "on" },
			{ id: 3, status: "on" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(render(container)).toEqual(["on:1", "on:2", "on:3"]);
	run(container, $state);
});

test("keyed for with inner switch updates branches without chain corruption -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, status: "on" },
			{ id: 2, status: "on" },
			{ id: 3, status: "on" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(render(container)).toEqual(["on:1", "on:2", "on:3"]);
	run(container, $state);
});
