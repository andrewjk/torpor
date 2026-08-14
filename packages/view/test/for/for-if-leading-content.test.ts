import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `@for` body with content BEFORE the inner `@if`: the row's node window
// starts at the leading content, not at the control's anchor, so branch
// content rendered later is inserted INSIDE the window — widening must
// correctly no-op, and branch toggles/clears must not corrupt the chain.

const source = `
export default function ForIfLeadingContent($props: { todos: Array<{ id: number, done: boolean }> }) {
	@render {
		<ul>
			@for (let t of $props.todos) {
				@key = t.id
				<li>{t.id}</li>
				@if (t.done) {
					<b class="mark">{t.id}</b>
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

function rows(container: HTMLElement): string[] {
	const out: string[] = [];
	for (const li of container.querySelectorAll("li")) {
		const mark = li.nextElementSibling?.tagName === "B" ? "*" : "";
		out.push(li.textContent?.trim() + mark);
	}
	return out;
}

test("for with leading content before inner if toggles cleanly", async () => {
	let $state = $watch({
		todos: [
			{ id: 1, done: false },
			{ id: 2, done: true },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// One row mounted with its branch rendered, one without
	assertRegionChain();
	expect(rows(container)).toEqual(["1", "2*"]);

	// Toggle the off row on: <b> inserted before the anchor, after the <li>
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: true }));
	assertRegionChain();
	expect(rows(container)).toEqual(["1*", "2*"]);

	// Toggle all off: branch content cleared, leading content kept
	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: false }));
	assertRegionChain();
	expect(rows(container)).toEqual(["1", "2"]);

	// Remove rows while branches are off, then clear all
	$state.todos = $state.todos.slice(0, 1);
	assertRegionChain();
	expect(rows(container)).toEqual(["1"]);

	$state.todos = $state.todos.map((t: Todo) => ({ ...t, done: true }));
	assertRegionChain();
	expect(rows(container)).toEqual(["1*"]);

	$state.todos = [];
	assertRegionChain();
	expect(container.querySelectorAll("li").length).toBe(0);
	expect(container.querySelectorAll("b").length).toBe(0);
	expect(container.querySelector("footer")).toHaveTextContent("after");
});
