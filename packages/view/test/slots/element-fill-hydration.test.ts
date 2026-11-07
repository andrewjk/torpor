import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// NOTE: The fill's root element must not be a tag the HTML parser
// auto-closes inside the host's wrapper (e.g. a fill `<li>` inside a host
// `<li><slot/></li>` re-nests the markup and breaks region adoption). The
// host here wraps rows in a `<div>`, so an element fill hydrates cleanly.
const source = `
export default function Let() {
	@render {
		<List items={$props.items}>
			<b>{$slot.item.text}</b>
		</List>
	}
}

function List() {
	@render {
		@for (let item of $props.items) {
			<div class="row">
				<slot item={item} />
			</div>
		}
	}
}
`;

function check(container: HTMLElement) {
	expect(queryByText(container, "item 1")).not.toBeNull();
	expect(queryByText(container, "item 2")).not.toBeNull();
	expect(container.querySelectorAll("b").length).toBe(2);
}

test("element fill -- mounted", async () => {
	let $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("element fill -- hydrated", async () => {
	let $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});
