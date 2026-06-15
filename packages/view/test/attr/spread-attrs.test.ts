import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function SpreadAttrs($props: { collapsed: boolean }) {
	@render {
		<div
			aria-expanded={$props.collapsed ? "false" : "true"}
			data-state={$props.collapsed ? "collapsed" : "expanded"}
		>
			<p>Content</p>
		</div>
	}
}
`;

test("dynamic attributes toggle -- mounted", async () => {
	let $state = $watch({ collapsed: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const div = queryByText(container, "Content")!.parentElement!;
	expect(div).toHaveAttribute("aria-expanded", "false");
	expect(div).toHaveAttribute("data-state", "collapsed");

	$state.collapsed = false;
	expect(div).toHaveAttribute("aria-expanded", "true");
	expect(div).toHaveAttribute("data-state", "expanded");
});

test("dynamic attributes toggle -- hydrated", async () => {
	let $state = $watch({ collapsed: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	const div = queryByText(container, "Content")!.parentElement!;
	expect(div).toHaveAttribute("data-state", "collapsed");

	$state.collapsed = false;
	expect(div).toHaveAttribute("data-state", "expanded");
});
