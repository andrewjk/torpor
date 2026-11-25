import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function IfHeaderSymbols() {
	let $state = $watch({ text: "{};()" });

	@render {
		@if ($state.text === "{};()") {
			<p>literal</p>
		} else {
			<p>other</p>
		}
		@if (/[{};]/.test($state.text)) {
			<p>regex</p>
		}
	}
}
`;

test("if headers with strings and regexes -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("if headers with strings and regexes -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	// The component owns its state, so only the initial render is checked here.
	// The same header text is parsed and compiled for both mount paths.
	expect(queryByText(container, "literal")).not.toBeNull();
	expect(queryByText(container, "other")).toBeNull();
	expect(queryByText(container, "regex")).not.toBeNull();
}
