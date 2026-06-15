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
export default function ForReactive($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
	}
}
`;

test("for reactive list -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for reactive list -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "a")).not.toBeNull();
	expect(queryByText(container, "b")).not.toBeNull();
	expect(queryByText(container, "c")).not.toBeNull();
	expect(queryByText(container, "d")).toBeNull();

	state.items = ["x", "y"];

	expect(queryByText(container, "a")).toBeNull();
	expect(queryByText(container, "b")).toBeNull();
	expect(queryByText(container, "c")).toBeNull();
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "y")).not.toBeNull();
}
