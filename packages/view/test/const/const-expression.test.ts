import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ConstExpression() {
	@render {
		@const x = 2 + 3
		@const greeting = "Hello, " + "World"
		@const isEven = 4 % 2 === 0
		<p>x = {x}</p>
		<p>greeting = {greeting}</p>
		<p>isEven = {isEven}</p>
	}
}
`;

test("const expression -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("const expression -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "x = 5")).not.toBeNull();
	expect(queryByText(container, "greeting = Hello, World")).not.toBeNull();
	expect(queryByText(container, "isEven = true")).not.toBeNull();
}
