import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Regression test for the region-chain cycle that hung `runListItems`'s
// relink walk: a keyed `@for` over a reactive array with an inner `@if` in
// its body gained a cyclic sibling chain (item's `@if` region linked back
// into itself) as soon as the array was updated, hanging the main thread in
// an infinite synchronous loop.

const source = `
export default function ForIfReactive($props: { todos: Array<{ id: number, done: boolean }> }) {
	@render {
		<ul>
			@for (let t of $props.todos) {
				@key = t.id
				@if (t.done) {
					<li class="done">{t.id}</li>
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

function createState(todos: Todo[]) {
	return $watch({ todos });
}

function items(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
}

test("keyed for with inner if toggles without hanging -- mounted", async () => {
	let $state = createState([
		{ id: 1, done: false },
		{ id: 2, done: false },
		{ id: 3, done: false },
	]);

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const toggle = (done: boolean) => {
		$state.todos = $state.todos.map((t: Todo) => ({ ...t, done }));
	};

	expect(items(container)).toEqual([]);

	toggle(true);
	expect(items(container)).toEqual(["1", "2", "3"]);

	toggle(false);
	expect(items(container)).toEqual([]);

	toggle(true);
	expect(items(container)).toEqual(["1", "2", "3"]);

	toggle(false);
	expect(items(container)).toEqual([]);

	// The sibling after the list must survive the updates
	expect(container.querySelector("footer")).toHaveTextContent("after");
});

test("keyed for with inner if toggles without hanging -- hydrated", async () => {
	let $state = createState([
		{ id: 1, done: false },
		{ id: 2, done: false },
	]);

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const toggle = (done: boolean) => {
		$state.todos = $state.todos.map((t: Todo) => ({ ...t, done }));
	};

	toggle(true);
	expect(items(container)).toEqual(["1", "2"]);

	toggle(false);
	expect(items(container)).toEqual([]);

	toggle(true);
	expect(items(container)).toEqual(["1", "2"]);
});

test("keyed for with inner if appends and removes while branches render", async () => {
	let $state = createState([
		{ id: 1, done: true },
		{ id: 2, done: false },
	]);

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(items(container)).toEqual(["1"]);

	// Append (mount pass) while item 1's branch is rendered
	$state.todos = [...$state.todos, { id: 3, done: true }, { id: 4, done: false }];
	expect(items(container)).toEqual(["1", "3"]);

	// Remove from the middle (clear pass) while branches are rendered
	$state.todos = $state.todos.filter((t: Todo) => t.id !== 1);
	expect(items(container)).toEqual(["3"]);

	// Toggle the survivors off then on
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: false }));
	expect(items(container)).toEqual([]);
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: true }));
	expect(items(container)).toEqual(["2", "3", "4"]);

	// Clear all
	$state.todos = [];
	expect(items(container)).toEqual([]);
	expect(container.querySelector("footer")).toHaveTextContent("after");
});

test("keyed for with inner if replaces rows with fresh keys", async () => {
	let $state = createState([
		{ id: 1, done: true },
		{ id: 2, done: true },
	]);

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(items(container)).toEqual(["1", "2"]);

	// Full replacement with new keys (no-overlap fast path)
	$state.todos = [
		{ id: 3, done: false },
		{ id: 4, done: true },
	];
	expect(items(container)).toEqual(["4"]);

	// Back to empty, then re-populate
	$state.todos = [];
	expect(items(container)).toEqual([]);
	$state.todos = [{ id: 5, done: true }];
	expect(items(container)).toEqual(["5"]);
});
