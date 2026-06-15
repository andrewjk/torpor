import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MultipleProps() {
	@render {
		<Card title="My Card" subtitle="A subtitle" count={42} active={true} />
	}
}

function Card() {
	@render {
		<div>
			<h2>{$props.title}</h2>
			<h3>{$props.subtitle}</h3>
			<p>Count: {$props.count}</p>
			@if ($props.active) {
				<span>Active</span>
			} else {
				<span>Inactive</span>
			}
		</div>
	}
}
`;

test("multiple props -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "My Card")).not.toBeNull();
	expect(queryByText(container, "A subtitle")).not.toBeNull();
	expect(queryByText(container, "Count: 42")).not.toBeNull();
	expect(queryByText(container, "Active")).not.toBeNull();
	expect(queryByText(container, "Inactive")).toBeNull();
});

test("multiple props -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "My Card")).not.toBeNull();
	expect(queryByText(container, "A subtitle")).not.toBeNull();
	expect(queryByText(container, "Count: 42")).not.toBeNull();
	expect(queryByText(container, "Active")).not.toBeNull();
});
