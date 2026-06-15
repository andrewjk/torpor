import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: { id: number; name: string; active: boolean }[];
}

const source = `
export default function ForObjectProps($props: { items: { id: number; name: string; active: boolean }[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>
					<span>{item.name}</span>
					@if (item.active) {
						<strong>*</strong>
					}
				</li>
			}
		</ul>
	}
}
`;

test("for object property updates -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice", active: true },
			{ id: 2, name: "Bob", active: false },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Alice")).not.toBeNull();
	expect(queryByText(container, "Bob")).not.toBeNull();
	expect(container.querySelectorAll("strong").length).toBe(1);

	// Toggle active state on existing item
	$state.items[1].active = true;
	expect(container.querySelectorAll("strong").length).toBe(2);

	$state.items[0].active = false;
	expect(container.querySelectorAll("strong").length).toBe(1);

	// Update name
	$state.items[0].name = "Alicia";
	expect(queryByText(container, "Alicia")).not.toBeNull();
	expect(queryByText(container, "Alice")).toBeNull();
});

test("for object property updates -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, name: "Alice", active: true },
			{ id: 2, name: "Bob", active: false },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Alice")).not.toBeNull();

	$state.items[0].name = "Alicia";
	expect(queryByText(container, "Alicia")).not.toBeNull();
});
