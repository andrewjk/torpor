import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function PickPill() {
	let $state = $watch({
		picked: "red"
	});

	@render {
		<div>Picked: {$state.picked}</div>

		<input id="blue-pill" &group={$state.picked} type="radio" value="blue" />
		<label for="blue-pill">Blue pill</label>

		<input id="red-pill" &group={$state.picked} type="radio" value="red" />
		<label for="red-pill">Red pill</label>
	}
}
`;

test("input radio -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("input radio -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const blueRadio = container.getElementsByTagName("input")[0];
	const redRadio = container.getElementsByTagName("input")[1];

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();

	await userEvent.click(blueRadio);

	expect(queryByText(container, "Picked: red")).toBeNull();
	expect(queryByText(container, "Picked: blue")).not.toBeNull();

	await userEvent.click(redRadio);

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();
}
