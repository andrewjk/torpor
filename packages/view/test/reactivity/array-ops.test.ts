import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ReactiveNewProp($props: { items: string[]; newItem: string }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
		<p>Count: {$props.items.length}</p>
		<p>First: {$props.items[0]}</p>
		<p>Last: {$props.items[$props.items.length - 1]}</p>
		<p>New: {$props.newItem}</p>
	}
}
`;

test("array push adds items reactively -- mounted", async () => {
	let $state = $watch({ items: ["a", "b"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "Last: b")).not.toBeNull();

	$state.items.push("c");
	expect(queryByText(container, "Count: 3")).not.toBeNull();
	expect(queryByText(container, "Last: c")).not.toBeNull();
	expect(queryByText(container, "c")).not.toBeNull();

	$state.items.push("d", "e");
	expect(queryByText(container, "Count: 5")).not.toBeNull();
	expect(queryByText(container, "Last: e")).not.toBeNull();
});

test("array push adds items reactively -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "Last: b")).not.toBeNull();

	$state.items.push("c");
	expect(queryByText(container, "Count: 3")).not.toBeNull();
	expect(queryByText(container, "Last: c")).not.toBeNull();
	expect(queryByText(container, "c")).not.toBeNull();

	$state.items.push("d", "e");
	expect(queryByText(container, "Count: 5")).not.toBeNull();
	expect(queryByText(container, "Last: e")).not.toBeNull();
});

test("array splice removes and adds reactively -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c", "d"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Count: 4")).not.toBeNull();

	$state.items.splice(1, 2, "x", "y", "z");
	expect(queryByText(container, "Count: 5")).not.toBeNull();
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "z")).not.toBeNull();
	expect(queryByText(container, "b")).toBeNull();
	expect(queryByText(container, "c")).toBeNull();
});

test("array splice removes and adds reactively -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c", "d"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Count: 4")).not.toBeNull();

	$state.items.splice(1, 2, "x", "y", "z");
	expect(queryByText(container, "Count: 5")).not.toBeNull();
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "z")).not.toBeNull();
	expect(queryByText(container, "b")).toBeNull();
	expect(queryByText(container, "c")).toBeNull();
});

test("array pop removes last reactively -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items.pop();
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "c")).toBeNull();
});

test("array pop removes last reactively -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	$state.items.pop();
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "c")).toBeNull();
});

test("array shift removes first reactively -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items.shift();
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "First: b")).not.toBeNull();
	expect(queryByText(container, "a")).toBeNull();
});

test("array shift removes first reactively -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	$state.items.shift();
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "First: b")).not.toBeNull();
	expect(queryByText(container, "a")).toBeNull();
});

test("array unshift adds to front reactively -- mounted", async () => {
	let $state = $watch({ items: ["b", "c"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items.unshift("a");
	expect(queryByText(container, "First: a")).not.toBeNull();
	expect(queryByText(container, "Count: 3")).not.toBeNull();

	$state.items.unshift("z", "y");
	expect(queryByText(container, "First: z")).not.toBeNull();
	expect(queryByText(container, "Count: 5")).not.toBeNull();
});

test("array unshift adds to front reactively -- hydrated", async () => {
	let $state = $watch({ items: ["b", "c"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	$state.items.unshift("a");
	expect(queryByText(container, "First: a")).not.toBeNull();
	expect(queryByText(container, "Count: 3")).not.toBeNull();

	$state.items.unshift("z", "y");
	expect(queryByText(container, "First: z")).not.toBeNull();
	expect(queryByText(container, "Count: 5")).not.toBeNull();
});

test("array length truncation -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c", "d", "e"], newItem: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Count: 5")).not.toBeNull();

	($state.items as any).length = 2;
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "c")).toBeNull();
	expect(queryByText(container, "d")).toBeNull();
});

test("array length truncation -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c", "d", "e"], newItem: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Count: 5")).not.toBeNull();

	($state.items as any).length = 2;
	expect(queryByText(container, "Count: 2")).not.toBeNull();
	expect(queryByText(container, "c")).toBeNull();
	expect(queryByText(container, "d")).toBeNull();
});
