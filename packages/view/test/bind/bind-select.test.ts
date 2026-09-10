import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function SelectBind($props: { value: string }) {
	@render {
		<select &value={$props.value}>
			<option value="a">Option A</option>
			<option value="b">Option B</option>
			<option value="c">Option C</option>
		</select>
		<p>Selected: {$props.value}</p>
	}
}
`;

test("select binding sets initial value -- mounted", async () => {
	let $state = $watch({ value: "b" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("b");

	select.value = "c";
	select.dispatchEvent(new Event("change", { bubbles: true }));

	expect($state.value).toBe("c");
	expect(queryByText(container, "Selected: c")).not.toBeNull();
});

test("select binding reacts to state change -- mounted", async () => {
	let $state = $watch({ value: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("a");

	$state.value = "c";
	expect(select.value).toBe("c");
});

test("select binding -- hydrated", async () => {
	let $state = $watch({ value: "b" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("b");

	select.value = "a";
	select.dispatchEvent(new Event("change", { bubbles: true }));

	expect($state.value).toBe("a");
});
