import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function StyleCustomProp($props: { styleVar: string; customProp: string }) {
	@render {
		<div style={{ "--my-color": $props.styleVar, color: "var(--my-color)" }}>
			Colored text
		</div>
	}
}
`;

test("CSS custom properties in style -- mounted", async () => {
	let $state = $watch({ styleVar: "#ff0000", customProp: "test" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const el = queryByText(container, "Colored text")!;
	expect(el).toHaveStyle({ "--my-color": "#ff0000" });

	$state.styleVar = "#00ff00";
	expect(el).toHaveStyle({ "--my-color": "#00ff00" });
});

test("CSS custom properties in style -- hydrated", async () => {
	let $state = $watch({ styleVar: "#ff0000", customProp: "test" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const el = queryByText(container, "Colored text")!;
	expect(el).toHaveStyle({ "--my-color": "#ff0000" });
});
