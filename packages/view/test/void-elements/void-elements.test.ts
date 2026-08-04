import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function VoidElements() {
	@render {
		<div>
			<input type="text" placeholder="type here" />
			<br />
			<hr />
			<img src="test.jpg" alt="test" />
			<p>After void elements</p>
		</div>
	}
}
`;

test("void elements render correctly -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(container.querySelector("input")).not.toBeNull();
	expect(container.querySelector("input")).toHaveAttribute("placeholder", "type here");
	expect(container.querySelector("br")).not.toBeNull();
	expect(container.querySelector("hr")).not.toBeNull();
	expect(container.querySelector("img")).not.toBeNull();
	expect(container.querySelector("img")).toHaveAttribute("src", "test.jpg");
	expect(queryByText(container, "After void elements")).not.toBeNull();
});

test("void elements render correctly -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(container.querySelector("input")).not.toBeNull();
	expect(container.querySelector("br")).not.toBeNull();
	expect(container.querySelector("img")).not.toBeNull();
	expect(queryByText(container, "After void elements")).not.toBeNull();
});
