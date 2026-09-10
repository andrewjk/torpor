import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	html: string;
}

const source = `
export default function HtmlUpdate($props: { html: string }) {
	@render {
		<div id="target">
			@html($props.html)
		</div>
	}
}
`;

test("html update -- mounted", async () => {
	let $state = $watch({ html: "<span>first</span>" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("html update -- hydrated", async () => {
	let $state = $watch({ html: "<span>first</span>" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "first")).not.toBeNull();

	state.html = "<em>second</em>";
	expect(queryByText(container, "first")).toBeNull();
	expect(queryByText(container, "second")).not.toBeNull();

	state.html = "<strong>third</strong>";
	expect(queryByText(container, "second")).toBeNull();
	expect(queryByText(container, "third")).not.toBeNull();
}
