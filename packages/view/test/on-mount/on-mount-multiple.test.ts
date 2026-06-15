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

	const input = container.getElementsByTagName("input")[0];
	expect(input.value).toBe("set by onmount");
	const select = container.getElementsByTagName("select")[0];
	expect(select.value).toBe("C");
});

test("onmount multiple elements -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	const input = container.getElementsByTagName("input")[0];
	expect(input.value).toBe("set by onmount");
});
