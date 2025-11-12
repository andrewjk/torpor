import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	html: string;
}

const source = `
export default function Html() {
	@render {
		<p>
			@html($props.html)
		</p>
	}
}
`;

test("html -- mounted", async () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("html -- hydrated", async () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: Props) {
	expect(queryByText(container, "I'm strong and emphasised")).not.toBeNull();
	expect(queryByText(container, "I'm strong and emphasised")?.outerHTML).toBe(
		"<em>I'm strong and emphasised</em>",
	);

	$state.html = "<ul><li>A list</li></ul>";

	expect(queryByText(container, "I'm strong and emphasised")).toBeNull();
	expect(queryByText(container, "A list")).not.toBeNull();
}
