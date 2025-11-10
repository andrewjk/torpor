import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { assert, expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Increment() {
	let $state = $watch({ counter: 0 })

	function increment(_: Event, num?: number) {
		$state.counter += num || 1;
	}

	@render {
		<button id="increment" onclick={increment}>
			Increment
		</button>
		<button id="increment5" onclick={(e) => increment(e, 5)}>
			Increment
		</button>
		<p>
			The count is {$state.counter}.
		</p>
	}
}
`;

test("events -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("events -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "The count is 0.")).not.toBeNull();

	const increment = Array.from(container.children).find((e) => e.id === "increment");
	assert(increment);
	await userEvent.click(increment);

	expect(queryByText(container, "The count is 1.")).not.toBeNull();

	const increment5 = Array.from(container.children).find((e) => e.id === "increment5");
	assert(increment5);
	await userEvent.click(increment5);

	expect(queryByText(container, "The count is 6.")).not.toBeNull();
}
