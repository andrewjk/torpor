import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BindComponent() {
	let $state = $watch({ name: "Alice", selected: 1 });

	@render {
		<BindText &name={$state.name} />
		<p>Hello, {$state.name}</p>
	}
}

function BindText() {
	@render {
		<input &value={$props.name} />
	}
}
`;

test("bind component value -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind component value -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];
	const para = container.getElementsByTagName("p")[0];

	expect(input).toHaveValue("Alice");
	expect(para).toHaveTextContent("Hello, Alice");

	// Update the input value
	await userEvent.clear(input);
	await userEvent.type(input, "Bob");

	expect(input).toHaveValue("Bob");
	expect(para).toHaveTextContent("Hello, Bob");
}
