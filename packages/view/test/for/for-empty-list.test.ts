import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: string[];
}

const source = `
export default function ForEmpty($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
		<p class="count">Count: {$props.items.length}</p>
	}
}
`;

test("for empty list -- mounted", async () => {
	let $state = $watch({ items: [] as string[] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for empty list -- hydrated", async () => {
	let $state = $watch({ items: [] as string[] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Count: 0")).not.toBeNull();

	state.items = ["hello"];
	expect(queryByText(container, "hello")).not.toBeNull();
	expect(queryByText(container, "Count: 1")).not.toBeNull();

	state.items = [];
	expect(queryByText(container, "hello")).toBeNull();
	expect(queryByText(container, "Count: 0")).not.toBeNull();
}
