import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function InputHello() {
	let $state = $watch({
		text: "Hello World"
	});

	@render {
		<p>{$state.text}</p>
		<input &value={$state.text} />
	}
}
`;

test("input text -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("input text -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(queryByText(container, "Hello World")).not.toBeNull();

	await userEvent.clear(input);
	await userEvent.type(input, "Hello Jane");

	expect(queryByText(container, "Hello Jane")).not.toBeNull();
}
