import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function DynamicTagAttrs($props: { tag: string; cls: string }) {
	@render {
		<@element
			self={$props.tag}
			id="target"
			class={$props.cls}
			onclick={(e) => e.currentTarget.setAttribute("data-clicked", "yes")}
		>
			Content
		</@element>
	}
}
`;

test("dynamic element with reactive attrs and events -- mounted", async () => {
	let $state = $watch({ tag: "div", cls: "one" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, "DIV", "one");

	// The tag swap carries attributes and listeners over to the new element
	$state.tag = "section";
	check(container, "SECTION", "one");

	// And reactive attribute updates target the swapped element
	$state.cls = "two";
	const el = container.querySelector("#target")!;
	expect(el).toHaveAttribute("class", "two");
});

test("dynamic element with reactive attrs and events -- hydrated", async () => {
	let $state = $watch({ tag: "div", cls: "one" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, "DIV", "one");

	$state.tag = "section";
	check(container, "SECTION", "one");
});

test("dynamic element with a static tag renders the tag with children", async () => {
	const staticSource = `
export default function StaticTag($props) {
	@render {
		<@element self="button" id="target">
			Content
		</@element>
	}
}
`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, staticSource, "client");
	mountComponent(container, component);

	const el = container.querySelector("#target")!;
	expect(el.tagName).toBe("BUTTON");
	expect(queryByText(container, "Content")).not.toBeNull();
});

function check(container: HTMLElement, tagName: string, cls: string) {
	const el = container.querySelector("#target")!;
	expect(el.tagName).toBe(tagName);
	// Reactive attribute applied
	expect(el).toHaveAttribute("class", cls);
	expect(queryByText(container, "Content")).not.toBeNull();

	// Click listener attached (delegated) and working
	el.removeAttribute("data-clicked");
	(el as HTMLElement).click();
	expect(el).toHaveAttribute("data-clicked", "yes");
}
