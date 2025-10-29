import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Counter() {
	let $state = $watch({
		count: 0
	});

	function incrementCount() {
		$state.count++;
	}

	@render {
		<p>Counter: {$state.count}</p>
		<button onclick={incrementCount}>+1</button>
	}
}
`;

test("event click -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("event click -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "Counter: 0")).not.toBeNull();

	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Counter: 1")).not.toBeNull();
}
