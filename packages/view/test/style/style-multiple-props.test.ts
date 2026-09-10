import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	color: string;
	fontSize: number;
	background: string;
}

const source = `
export default function StyleMultiple() {
	@render {
		<div id="multi" style={{ color: $props.color, fontSize: $props.fontSize + "px", background: $props.background }}>
			Multi style
		</div>
	}
}
`;

test("style multiple properties -- mounted", async () => {
	let $state = $watch({ color: "red", fontSize: 16, background: "white" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("style multiple properties -- hydrated", async () => {
	let $state = $watch({ color: "red", fontSize: 16, background: "white" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const el = queryByText(container, "Multi style")!;
	expect(el).toHaveStyle({ color: "rgb(255, 0, 0)", fontSize: "16px", background: "white" });

	state.color = "blue";
	state.fontSize = 24;
	state.background = "black";

	expect(el).toHaveStyle({ color: "rgb(0, 0, 255)", fontSize: "24px", background: "black" });
}
