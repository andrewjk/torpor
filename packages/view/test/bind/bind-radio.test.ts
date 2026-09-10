import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BindRadio() {
	let $state = $watch({ color: "red" });

	@render {
		<label>
			<input type="radio" name="color" value="red" &group={$state.color} />
			Red
		</label>
		<label>
			<input type="radio" name="color" value="green" &group={$state.color} />
			Green
		</label>
		<label>
			<input type="radio" name="color" value="blue" &group={$state.color} />
			Blue
		</label>
		<p>Selected: {$state.color}</p>
	}
}
`;

test("bind radio buttons -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind radio buttons -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const radios = container.querySelectorAll('input[type="radio"]');
	expect(radios.length).toBe(3);
	expect(radios[0]).toBeChecked();
	expect(queryByText(container, "Selected: red")).not.toBeNull();

	await userEvent.click(radios[1]);

	expect(radios[1]).toBeChecked();
	expect(radios[0]).not.toBeChecked();
	expect(queryByText(container, "Selected: green")).not.toBeNull();

	await userEvent.click(radios[2]);

	expect(radios[2]).toBeChecked();
	expect(queryByText(container, "Selected: blue")).not.toBeNull();
}
