import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function RefMultiple() {
	let inputEl: HTMLInputElement;
	let divEl: HTMLDivElement;

	@render {
		<input &ref={inputEl} value="typed" />
		<div &ref={divEl}>Content</div>
		<p>Input value: {inputEl?.value}</p>
		<p>Div text: {divEl?.textContent}</p>
	}
}
`;

test("ref multiple -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("ref multiple -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Input value: typed")).not.toBeNull();
	expect(queryByText(container, "Div text: Content")).not.toBeNull();
}
