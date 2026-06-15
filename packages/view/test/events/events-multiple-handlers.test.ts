import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function EventsMultiple() {
	let $state = $watch({ count: 0, lastAction: "" });

	function handleClick() {
		$state.count += 1;
		$state.lastAction = "clicked";
	}

	function handleDblClick() {
		$state.count += 10;
		$state.lastAction = "double-clicked";
	}

	@render {
		<button id="single" onclick={handleClick}>Single Click</button>
		<button id="double" ondblclick={handleDblClick}>Double Click</button>
		<p>Count: {$state.count}</p>
		<p>Last: {$state.lastAction}</p>
	}
}
`;

test("events multiple handlers -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("events multiple handlers -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "Count: 0")).not.toBeNull();

	const single = container.querySelector("#single")!;
	await userEvent.click(single);

	expect(queryByText(container, "Count: 1")).not.toBeNull();
	expect(queryByText(container, "Last: clicked")).not.toBeNull();

	const double = container.querySelector("#double")!;
	await userEvent.dblClick(double);

	expect(queryByText(container, "Count: 11")).not.toBeNull();
	expect(queryByText(container, "Last: double-clicked")).not.toBeNull();
}
