import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A &-binding and a user oninput handler on the same element must both run:
// they share a single t_event call, because delegated event handlers are
// last-write-wins per element and type
const source = `
export default function BindEventHandler() {
	let $state = $watch({ name: "Alice", typed: false });

	@render {
		<input &value={$state.name} oninput={() => { $state.typed = true; }} />
		<p>Hello, {$state.name}</p>
		@if ($state.typed) {
			<p>Handler ran</p>
		}
	}
}
`;

// Same, but with the handler attribute before the binding attribute
const reversedSource = `
export default function BindEventHandler() {
	let $state = $watch({ name: "Alice", typed: false });

	@render {
		<input oninput={() => { $state.typed = true; }} &value={$state.name} />
		<p>Hello, {$state.name}</p>
		@if ($state.typed) {
			<p>Handler ran</p>
		}
	}
}
`;

test("bind with input handler -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind with input handler -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

test("bind with input handler first -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, reversedSource, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind with input handler first -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, reversedSource, "client");
	const serverComponent = await importComponent(import.meta.filename, reversedSource, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(input).toHaveValue("Alice");
	expect(queryByText(container, "Hello, Alice")).not.toBeNull();

	await userEvent.type(input, "Bob");

	expect(input).toHaveValue("AliceBob");
	expect(queryByText(container, "Hello, AliceBob")).not.toBeNull();
	expect(queryByText(container, "Handler ran")).not.toBeNull();
}
