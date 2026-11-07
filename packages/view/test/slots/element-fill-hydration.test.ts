import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Let() {
	@render {
		<List items={$props.items}>
			<li><b>{$slot.item.text}</b></li>
		</List>
	}
}

function List() {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>
					<slot item={item} />
				</li> 
			}
		</ul>
	}
}
`;

function check(container: HTMLElement) {
	expect(queryByText(container, "item 1")).not.toBeNull();
	expect(queryByText(container, "item 2")).not.toBeNull();
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
	try {
		await hydrateComponent(container, clientComponent, serverComponent, $state);
	} catch (error) {
		const { writeFileSync } = await import("node:fs");
		writeFileSync("/tmp/element-fill-dom.txt", container.innerHTML + "\n\n" + String(error));
	}
	check(container);
});
