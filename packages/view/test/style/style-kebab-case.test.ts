import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function StyleKebab() {
	@render {
		<div style={{ marginLeft: "10px", marginRight: "20px", backgroundColor: "green" }}>
			Kebab case
		</div>
	}
}
`;

test("style kebab-case -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	const el = queryByText(container, "Kebab case")!;
	expect(el).toHaveStyle({ "margin-left": "10px", "margin-right": "20px", "background-color": "rgb(0, 128, 0)" });
});

test("style kebab-case -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	const el = queryByText(container, "Kebab case")!;
	expect(el).toHaveStyle({ "margin-left": "10px", "margin-right": "20px", "background-color": "rgb(0, 128, 0)" });
});
