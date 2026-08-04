import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function KeyedFor($props: { items: Array<{ id: number, name: string }> }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				key = item.id
				<li>{item.name}</li>
			}
		</ul>
	}
}
`;

test("keyed for renders initial list -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
			{ id: 3, name: "Charlie" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(3);
	expect(lis[0].textContent).toBe("Alice");
	expect(lis[1].textContent).toBe("Bob");
	expect(lis[2].textContent).toBe("Charlie");
});

test("keyed for renders initial list -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(2);
	expect(lis[0].textContent).toBe("Alice");
	expect(lis[1].textContent).toBe("Bob");
});

test("keyed for preserves DOM nodes when reordering", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
			{ id: 3, name: "Charlie" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let lis = container.querySelectorAll("li");
	let aliceEl = lis[0];
	let bobEl = lis[1];
	let charlieEl = lis[2];

	// Reverse the list
	$state.items = [
		{ id: 3, name: "Charlie" },
		{ id: 2, name: "Bob" },
		{ id: 1, name: "Alice" },
	];

	let newLis = container.querySelectorAll("li");
	expect(newLis.length).toBe(3);
	expect(newLis[0].textContent).toBe("Charlie");
	expect(newLis[1].textContent).toBe("Bob");
	expect(newLis[2].textContent).toBe("Alice");

	// Check that DOM nodes were reused (same references)
	expect(newLis[0]).toBe(charlieEl);
	expect(newLis[1]).toBe(bobEl);
	expect(newLis[2]).toBe(aliceEl);
});

test("keyed for removes correct item", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
			{ id: 3, name: "Charlie" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Remove Bob (middle)
	$state.items = [
		{ id: 1, name: "Alice" },
		{ id: 3, name: "Charlie" },
	];

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(2);
	expect(lis[0].textContent).toBe("Alice");
	expect(lis[1].textContent).toBe("Charlie");
});

test("keyed for inserts at beginning", async () => {
	let $state = $watch({
		items: [{ id: 2, name: "Bob" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = [
		{ id: 1, name: "Alice" },
		{ id: 2, name: "Bob" },
	];

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(2);
	expect(lis[0].textContent).toBe("Alice");
	expect(lis[1].textContent).toBe("Bob");
});

test("keyed for updates item content", async () => {
	let $state = $watch({
		items: [{ id: 1, name: "Alice" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items[0].name = "Alicia";

	let li = container.querySelector("li");
	expect(li?.textContent).toBe("Alicia");
});

test("keyed for clears all items", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = [];

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(0);
});

test("keyed for grows from empty", async () => {
	let $state = $watch({
		items: [] as Array<{ id: number; name: string }>,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(container.querySelectorAll("li").length).toBe(0);

	$state.items = [
		{ id: 1, name: "Alice" },
		{ id: 2, name: "Bob" },
	];

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(2);
	expect(lis[0].textContent).toBe("Alice");
	expect(lis[1].textContent).toBe("Bob");
});
