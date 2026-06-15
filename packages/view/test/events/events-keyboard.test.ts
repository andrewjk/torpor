import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function EventsKeyboard() {
	let $state = $watch({ lastKey: "none" });

	function handleKeyDown(e: KeyboardEvent) {
		$state.lastKey = e.key;
	}

	@render {
		<input id="keyinput" onkeydown={handleKeyDown} />
		<p>Last key: {$state.lastKey}</p>
	}
}
`;

test("events keyboard -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("events keyboard -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.querySelector("#keyinput") as HTMLInputElement;
	expect(input).not.toBeNull();

	await userEvent.type(input, "a");
	expect(queryByText(container, "Last key: a")).not.toBeNull();

	await userEvent.type(input, "{Enter}");
	expect(queryByText(container, "Last key: Enter")).not.toBeNull();
}
