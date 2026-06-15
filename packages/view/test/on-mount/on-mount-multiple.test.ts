import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function OnMountMultiple() {
	let inputEl: HTMLInputElement;
	let selectEl: HTMLSelectElement;

	@render {
		<input &ref={inputEl} onmount={(node) => node.value = "set by onmount"} />
		<select &ref={selectEl} onmount={(node) => node.selectedIndex = 2}>
			<option>A</option>
			<option>B</option>
			<option>C</option>
		</select>
		<p>Input: {inputEl?.value}</p>
		<p>Select: {selectEl?.value}</p>
	}
}
`;

test("onmount multiple elements -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Input: set by onmount")).not.toBeNull();
	expect(queryByText(container, "Select: C")).not.toBeNull();
});

test("onmount multiple elements -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Input: set by onmount")).not.toBeNull();
});
