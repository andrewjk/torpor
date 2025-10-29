import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ColorSelect() {
	let $state = $watch({
		selectedColorId: 2
	});

	const colors = [
		{ id: 1, text: "red" },
		{ id: 2, text: "blue" },
		{ id: 3, text: "green" },
		{ id: 4, text: "gray", isDisabled: true },
	];

	@render {
		<div>Selected: {colors[$state.selectedColorId - 1].text}</div>

		<select &value={$state.selectedColorId}>
			@for (let color of colors) {
				<option value={color.id} disabled={color.isDisabled}>
					{color.text}
				</option>
			}
		</select>
	}
}
`;

test("input select -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("input select -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const select = container.getElementsByTagName("select")[0];

	expect(queryByText(container, "Selected: blue")).not.toBeNull();

	await userEvent.selectOptions(select, "1");

	expect(queryByText(container, "Selected: red")).not.toBeNull();

	await userEvent.selectOptions(select, "3");

	expect(queryByText(container, "Selected: green")).not.toBeNull();

	// This shouldn't work because the option is disabled
	await userEvent.selectOptions(select, "4");

	expect(queryByText(container, "Selected: gray")).toBeNull();
	expect(queryByText(container, "Selected: green")).not.toBeNull();
}
