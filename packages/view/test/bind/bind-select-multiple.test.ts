import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MultiSelectBind($props: { values: string[] }) {
	@render {
		<select multiple &value={$props.values}>
			<option value="a">A</option>
			<option value="b">B</option>
			<option value="c">C</option>
		</select>
	}
}
`;

test("multi-select binding -- mounted", async () => {
	let $state = $watch({ values: ["a", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	let options = select.options;

	expect(options[0].selected).toBe(true);
	expect(options[1].selected).toBe(false);
	expect(options[2].selected).toBe(true);
});

test("multi-select reacts to state change -- mounted", async () => {
	let $state = $watch({ values: ["a"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;

	$state.values = ["b", "c"];

	let options = select.options;
	expect(options[0].selected).toBe(false);
	expect(options[1].selected).toBe(true);
	expect(options[2].selected).toBe(true);
});

test("multi-select -- hydrated", async () => {
	let $state = $watch({ values: ["a", "b"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	let options = select.options;

	expect(options[0].selected).toBe(true);
	expect(options[1].selected).toBe(true);
});
