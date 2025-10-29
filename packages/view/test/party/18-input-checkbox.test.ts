import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function IsAvailable() {
	let $state = $watch({
		isAvailable: false
	});

	@render {
		<div>{$state.isAvailable ? "Available" : "Not available"}</div>

		<input id="is-available" type="checkbox" &checked={$state.isAvailable} />
		<label for="is-available">Is available</label>
	}
}
`;

test("input checkbox -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("input checkbox -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(queryByText(container, "Not available")).not.toBeNull();

	await userEvent.click(input);

	expect(queryByText(container, "Available")).not.toBeNull();
}
