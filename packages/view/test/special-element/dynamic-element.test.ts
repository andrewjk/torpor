import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function DynamicTag($props: { tag: string }) {
	@render {
		<@element self={$props.tag} id="target">
			Content
		</@element>
	}
}
`;

test("dynamic element renders correct tag -- mounted", async () => {
	let $state = $watch({ tag: "div" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let el = container.querySelector("#target");
	expect(el?.tagName).toBe("DIV");

	$state.tag = "section";
	el = container.querySelector("#target");
	expect(el?.tagName).toBe("SECTION");

	$state.tag = "article";
	el = container.querySelector("#target");
	expect(el?.tagName).toBe("ARTICLE");

	expect(queryByText(container, "Content")).not.toBeNull();
});

test("dynamic element renders correct tag -- hydrated", async () => {
	let $state = $watch({ tag: "span" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	let el = container.querySelector("#target");
	expect(el?.tagName).toBe("SPAN");

	$state.tag = "header";
	el = container.querySelector("#target");
	expect(el?.tagName).toBe("HEADER");
});

test("dynamic element preserves children when tag changes", async () => {
	let $state = $watch({ tag: "div" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Content")).not.toBeNull();

	$state.tag = "section";
	expect(queryByText(container, "Content")).not.toBeNull();
});

test("dynamic element with attrs preserved on tag change", async () => {
	const attrSource = `
	export default function DynamicTagWithAttr($props: { tag: string }) {
		@render {
			<@element self={$props.tag} id="target" data-role={$props.tag}>
				Content
			</@element>
		}
	}
	`;

	let $state = $watch({ tag: "div" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, attrSource, "client");
	mountComponent(container, component, $state);

	let el = container.querySelector("#target");
	expect(el?.getAttribute("data-role")).toBe("div");

	$state.tag = "nav";
	el = container.querySelector("#target");
	expect(el?.getAttribute("data-role")).toBe("nav");
});
