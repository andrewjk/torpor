import { queryByRole } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	name: string;
}

const source = `
export default function Shape($props: { name: string }) {
	@render {
		<svg class={{ "svg-cls": true }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img">
			@if ($props.name === "rect") {
				<rect width="100" height="100" fill="red"></rect>
			} else {
				<circle r="45" cx="50" cy="50" fill="red"></circle>
			}
		</svg>
	}
}
`;

test("svg -- mounted", async () => {
	let $state = $watch({ name: "rect" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("svg -- hydrated", async () => {
	let $state = $watch({ name: "rect" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const img = queryByRole(container, "img");
	expect(img).not.toBeNull();

	expect(img).toContainHTML('<rect width="100" height="100" fill="red"></rect>');

	state.name = "circle";

	expect(img).toContainHTML('<circle r="45" cx="50" cy="50" fill="red"></circle>');
}
