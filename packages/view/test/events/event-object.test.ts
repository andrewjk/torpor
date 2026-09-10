import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

afterEach(() => {
	document.body.innerHTML = "";
});

const source = `
export default function EventObject() {
	let $state = $watch({ type: "", target: "", currentTarget: "" });

	@render {
		<button id="btn" onclick={(e) => {
			$state.type = e.type;
			$state.target = (e.target as HTMLElement).tagName;
			$state.currentTarget = (e.currentTarget as HTMLElement).tagName;
		}}>
			Click me
		</button>
		<p>Type: {$state.type}</p>
		<p>Target: {$state.target}</p>
		<p>Current: {$state.currentTarget}</p>
	}
}
`;

test("event object properties -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	const btn = container.querySelector("#btn")!;
	await userEvent.click(btn);

	expect(queryByText(container, "Type: click")).not.toBeNull();
	expect(queryByText(container, "Target: BUTTON")).not.toBeNull();
	expect(queryByText(container, "Current: BUTTON")).not.toBeNull();
});

test("event object properties -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	const btn = container.querySelector("#btn")!;
	await userEvent.click(btn);

	expect(queryByText(container, "Type: click")).not.toBeNull();
});
