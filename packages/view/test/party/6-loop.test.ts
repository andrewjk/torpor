import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Colors() {
	const colors = ["red", "green", "blue"];

	@render {
		<ul>
			@for (let color of colors) {
				@key = color
				<li>{color}</li>
			}
		</ul>
	}
}
`;

test("loop -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("loop -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "red")).not.toBeNull();
	expect(queryByText(container, "green")).not.toBeNull();
	expect(queryByText(container, "blue")).not.toBeNull();
}
