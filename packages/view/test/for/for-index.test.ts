import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForIndex($props: { list: string[] }) {
	@render {
		<ul>
			@for (let i = 0; i < $props.list.length; i++) {
				<li>Item {i}: {$props.list[i]}</li>
			}
		</ul>
	}
}
`;

test("for loop with index access -- mounted", async () => {
	let $state = $watch({ list: ["alpha", "beta", "gamma"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Item 0: alpha")).not.toBeNull();
	expect(queryByText(container, "Item 1: beta")).not.toBeNull();
	expect(queryByText(container, "Item 2: gamma")).not.toBeNull();

	$state.list = ["one", "two"];
	expect(queryByText(container, "Item 0: one")).not.toBeNull();
	expect(queryByText(container, "Item 1: two")).not.toBeNull();
	expect(queryByText(container, "Item 0: alpha")).toBeNull();
});

test("for loop with index access -- hydrated", async () => {
	let $state = $watch({ list: ["alpha", "beta"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Item 0: alpha")).not.toBeNull();
	expect(queryByText(container, "Item 1: beta")).not.toBeNull();
});
