import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Let($props: any) {
	@render {
		<List items={$props.items}>
			<fill>
				{$sprops.item.text}
			</fill>
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

test("let slot -- mounted", async () => {
	let $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("let slot -- hydrated", async () => {
	let $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "item 1")).not.toBeNull();
	expect(queryByText(container, "item 2")).not.toBeNull();
	expect(queryByText(container, "item 3")).not.toBeNull();
}
