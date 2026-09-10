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
export default function ForReverse($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
	}
}
`;

test("for reverse -- mounted", async () => {
	let $state = $watch({ items: ["first", "second", "third"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for reverse -- hydrated", async () => {
	let $state = $watch({ items: ["first", "second", "third"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "first")).not.toBeNull();
	expect(queryByText(container, "second")).not.toBeNull();
	expect(queryByText(container, "third")).not.toBeNull();

	state.items = [...state.items].reverse();

	expect(queryByText(container, "first")).not.toBeNull();
	expect(queryByText(container, "second")).not.toBeNull();
	expect(queryByText(container, "third")).not.toBeNull();

	const lis = container.querySelectorAll("li");
	expect(lis[0]).toHaveTextContent("third");
	expect(lis[1]).toHaveTextContent("second");
	expect(lis[2]).toHaveTextContent("first");
}
