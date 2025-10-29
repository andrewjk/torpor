import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function CssStyle() {
	@render {
		<h1 class="title">I am red</h1>
		<button style="font-size: 10rem;">I am a button</button>
	}

	@style {
		.title {
			color: red;
		}
	}
}
`;

test("minimal template -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("minimal template -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "I am red")).toHaveClass("title");
	expect(queryByText(container, "I am a button")).toHaveStyle("font-size: 10rem");
}
