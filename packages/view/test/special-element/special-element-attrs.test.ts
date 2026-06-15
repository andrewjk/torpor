import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	tag: string;
	content: string;
}

const source = `
export default function SpecialElementAttrs($props: { tag: string; content: string }) {
	@render {
		<@element self={$props.tag} id="dynamic" class="custom" data-value="test">
			{$props.content}
		</@element>
	}
}
`;

test("special element with attrs -- mounted", async () => {
	let $state = $watch({ tag: "h2", content: "Hello" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special element with attrs -- hydrated", async () => {
	let $state = $watch({ tag: "h2", content: "Hello" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const el = queryByText(container, "Hello")!;
	expect(el.tagName).toBe("H2");
	expect(el).toHaveAttribute("id", "dynamic");
	expect(el).toHaveAttribute("class", "custom");

	state.content = "World";
	expect(queryByText(container, "World")).not.toBeNull();
	expect(queryByText(container, "Hello")).toBeNull();

	state.tag = "p";
	const pEl = queryByText(container, "World")!;
	expect(pEl.tagName).toBe("P");
}
