import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Reorders (moveRegion via the LIS pass) after branch content has been
// rendered by a control re-run: the moved row carries its WIDENED node
// window, so a move that misses nodes would leak them.

const source = `
export default function ForMoveAfterToggle($props: { todos: Array<{ id: number, done: boolean }> }) {
	@render {
		<ul>
			@for (let t of $props.todos) {
				@key = t.id
				@if (t.done) {
					<li>{t.id}</li>
				}
			}
		</ul>
		<footer>after</footer>
	}
}
`;

interface Todo {
	id: number;
	done: boolean;
}

function ids(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
}

test("moves after a toggle carry the widened window", async () => {
	let $state = $watch({
		todos: [1, 2, 3, 4, 5].map((id) => ({ id, done: false })),
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(ids(container)).toEqual([]);

	// Render branch content via a control re-run (windows widen)
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: true }));
	assertRegionChain();
	expect(ids(container)).toEqual(["1", "2", "3", "4", "5"]);

	// Full reversal — rotation moves (head→tail / tail→head)
	$state.todos = [...$state.todos].reverse();
	assertRegionChain();
	expect(ids(container)).toEqual(["5", "4", "3", "2", "1"]);

	// Messy-middle shuffle — LIS moves
	$state.todos = [2, 4, 5, 1, 3].map((id) => ({ id, done: true }));
	assertRegionChain();
	expect(ids(container)).toEqual(["2", "4", "5", "1", "3"]);

	// Rotate a single item to the front
	const three = $state.todos.find((t: Todo) => t.id === 3)!;
	$state.todos = [three, ...$state.todos.filter((t: Todo) => t.id !== 3)];
	assertRegionChain();
	expect(ids(container)).toEqual(["3", "2", "4", "5", "1"]);

	// Toggle everything off, then move while off
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: false }));
	assertRegionChain();
	expect(ids(container)).toEqual([]);

	$state.todos = [...$state.todos].reverse();
	assertRegionChain();
	expect(ids(container)).toEqual([]);

	// Toggle back on — branch content inserts at each row's anchor in the
	// new order
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: true }));
	assertRegionChain();
	expect(ids(container)).toEqual(["1", "5", "4", "2", "3"]);

	// Clear all — no orphans
	$state.todos = [];
	assertRegionChain();
	expect(ids(container)).toEqual([]);
	expect(container.querySelector("footer")).toHaveTextContent("after");
});
