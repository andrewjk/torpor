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
export default function ForSort($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
	}
}
`;

function getItems(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
}

test("for list sort -- mounted", async () => {
	let $state = $watch({ items: ["banana", "apple", "cherry", "date"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(getItems(container)).toEqual(["banana", "apple", "cherry", "date"]);

	$state.items = [...$state.items].sort();
	expect(getItems(container)).toEqual(["apple", "banana", "cherry", "date"]);

	$state.items = [...$state.items].reverse();
	expect(getItems(container)).toEqual(["date", "cherry", "banana", "apple"]);
});

test("for list insert at beginning -- mounted", async () => {
	let $state = $watch({ items: ["b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(getItems(container)).toEqual(["b", "c"]);

	$state.items = ["a", "b", "c"];
	expect(getItems(container)).toEqual(["a", "b", "c"]);
});

test("for list insert in middle -- mounted", async () => {
	let $state = $watch({ items: ["a", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = ["a", "b", "c"];
	expect(getItems(container)).toEqual(["a", "b", "c"]);
});

test("for list remove from middle -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = ["a", "c"];
	expect(getItems(container)).toEqual(["a", "c"]);
});

test("for list complete replacement -- mounted", async () => {
	let $state = $watch({ items: ["a", "b", "c"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = ["x", "y", "z", "w"];
	expect(getItems(container)).toEqual(["x", "y", "z", "w"]);
});

test("for list grow and shrink -- mounted", async () => {
	let $state = $watch({ items: ["1"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.items = ["1", "2", "3", "4", "5"];
	expect(getItems(container)).toEqual(["1", "2", "3", "4", "5"]);

	$state.items = ["1", "2"];
	expect(getItems(container)).toEqual(["1", "2"]);

	$state.items = ["1", "2", "3"];
	expect(getItems(container)).toEqual(["1", "2", "3"]);
});
