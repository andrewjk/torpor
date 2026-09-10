import { queryByRole } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	type: string;
}

const source = `
export default function SvgDynamic($props: { type: string }) {
	@render {
		<svg viewBox="0 0 100 100" role="img">
			@if ($props.type === "circle") {
				<circle cx="50" cy="50" r="40" fill="blue"></circle>
			} else if ($props.type === "rect") {
				<rect x="10" y="10" width="80" height="80" fill="green"></rect>
			} else {
				<polygon points="50,10 90,90 10,90" fill="red"></polygon>
			}
		</svg>
	}
}
`;

test("svg dynamic -- mounted", async () => {
	let $state = $watch({ type: "circle" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("svg dynamic -- hydrated", async () => {
	let $state = $watch({ type: "circle" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const svg = queryByRole(container, "img");
	expect(svg).not.toBeNull();
	expect(svg).toContainHTML("<circle");

	state.type = "rect";
	expect(svg).toContainHTML("<rect");

	state.type = "polygon";
	expect(svg).toContainHTML("<polygon");
}
