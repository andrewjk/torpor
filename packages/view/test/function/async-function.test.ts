import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AsyncFunctionTest() {
	@render {
		<button id="btn">Click</button>
		<p>Status: idle</p>
	}
}
`;

test("async function defined in template -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Status: idle")).not.toBeNull();
});

test("async function defined in template -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Status: idle")).not.toBeNull();
});
