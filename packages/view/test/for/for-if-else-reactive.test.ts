import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Both branches of an inner `@if`/`@else` render content: whichever branch
// is NOT rendered at mount time gets inserted before the anchor on a later
// control re-run, so the row's node window must widen in BOTH directions.
// This is stronger than for-if-reactive (which only has then-branch content):
// toggling off → on and on → off each insert fresh content at the anchor.

const source = `
export default function ForIfElseReactive($props: { todos: Array<{ id: number, done: boolean }> }) {
	@render {
		<ul>
			@for (let t of $props.todos) {
				@key = t.id
				@if (t.done) {
					<li class="done">{t.id}</li>
				} @else {
					<li class="todo">{t.id}</li>
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

function render(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map(
		(li) => `${li.className}:${li.textContent?.trim()}`,
	);
}

function toggle(state: { todos: Todo[] }, done: boolean) {
	state.todos = state.todos.map((t) => ({ ...t, done }));
}

function run(container: HTMLElement, state: { todos: Todo[] }) {
	// Mounted with done=false → else branch rendered at mount
	expect(render(container)).toEqual(["todo:1", "todo:2"]);

	// Toggle on: then-branch content inserted at the anchor (row window
	// currently covers the else <li> from mount)
	toggle(state, true);
	assertRegionChain();
	expect(render(container)).toEqual(["done:1", "done:2"]);

	// Toggle off: else-branch content re-inserted after the then-li was
	// cleared
	toggle(state, false);
	assertRegionChain();
	expect(render(container)).toEqual(["todo:1", "todo:2"]);

	// Toggle on again, then remove rows while the then-branch is rendered
	toggle(state, true);
	assertRegionChain();
	expect(render(container)).toEqual(["done:1", "done:2"]);

	state.todos = [state.todos[1]!];
	assertRegionChain();
	expect(render(container)).toEqual(["done:2"]);

	state.todos = [];
	assertRegionChain();
	expect(render(container)).toEqual([]);
	expect(container.querySelector("footer")).toHaveTextContent("after");
}

test("keyed for with if/else content in both branches -- mounted", async () => {
	let $state = $watch({
		todos: [
			{ id: 1, done: false },
			{ id: 2, done: false },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	run(container, $state);
});

test("keyed for with if/else content in both branches -- hydrated", async () => {
	let $state = $watch({
		todos: [
			{ id: 1, done: false },
			{ id: 2, done: false },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	run(container, $state);
});
