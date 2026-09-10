import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: string[];
}

const source = `
export default function SlotDefault($props: { items: string[] }) {
	@render {
		<List>
			<p>Default content</p>
		</List>
		<ListWithItems items={$props.items} />
	}
}

function List() {
	@render {
		<ul>
			<slot>
				<li>Empty list</li>
			</slot>
		</ul>
	}
}

function ListWithItems() {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
	}
}
`;

test("slot default fallback -- mounted", async () => {
	let $state = $watch({ items: ["one", "two"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("slot default fallback -- hydrated", async () => {
	let $state = $watch({ items: ["one", "two"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Default content")).not.toBeNull();
	expect(queryByText(container, "Empty list")).toBeNull();
	expect(queryByText(container, "one")).not.toBeNull();
	expect(queryByText(container, "two")).not.toBeNull();

	state.items = ["x"];
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "one")).toBeNull();
}
