import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	todos: { text: string; done: boolean; priority: string }[];
	filter: string;
	sort: string;
}

const source = `
export default function IfForSwitchCombo($props: { todos: { text: string; done: boolean; priority: string }[]; filter: string; sort: string }) {
	@render {
		@if ($props.todos.length === 0) {
			<p>No todos</p>
		} else {
			@for (let todo of $props.todos) {
				@if ($props.filter === "all" || ($props.filter === "done" && todo.done) || ($props.filter === "pending" && !todo.done)) {
					<li>
						@switch (todo.priority) {
							case "high": {
								<strong>[HIGH] {todo.text}</strong>
							}
							case "low": {
								<em>[low] {todo.text}</em>
							}
							default: {
								<span>[med] {todo.text}</span>
							}
						}
					</li>
				}
			}
		}
	}
}
`;

test("if for switch combo -- mounted", async () => {
	let $state = $watch({
		todos: [
			{ text: "Fix bug", done: false, priority: "high" },
			{ text: "Write docs", done: true, priority: "med" },
			{ text: "Clean up", done: false, priority: "low" },
		],
		filter: "all",
		sort: "none",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if for switch combo -- hydrated", async () => {
	let $state = $watch({
		todos: [
			{ text: "Fix bug", done: false, priority: "high" },
			{ text: "Write docs", done: true, priority: "med" },
			{ text: "Clean up", done: false, priority: "low" },
		],
		filter: "all",
		sort: "none",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const strongs = container.querySelectorAll("strong");
	expect(strongs.length).toBe(1);
	expect(strongs[0]).toHaveTextContent("[HIGH] Fix bug");

	const ems = container.querySelectorAll("em");
	expect(ems.length).toBe(1);
	expect(ems[0]).toHaveTextContent("[low] Clean up");

	state.filter = "done";
	expect(queryByText(container, "[HIGH] Fix bug")).toBeNull();
	expect(queryByText(container, "[low] Clean up")).toBeNull();
	expect(queryByText(container, "[med] Write docs")).not.toBeNull();

	state.filter = "pending";
	expect(queryByText(container, "[med] Write docs")).toBeNull();
	expect(queryByText(container, "[HIGH] Fix bug")).not.toBeNull();
	expect(queryByText(container, "[low] Clean up")).not.toBeNull();

	state.filter = "all";
	state.todos = [];
	expect(queryByText(container, "No todos")).not.toBeNull();

	state.todos = [{ text: "New task", done: false, priority: "high" }];
	expect(queryByText(container, "No todos")).toBeNull();
	expect(queryByText(container, "[HIGH] New task")).not.toBeNull();
}
