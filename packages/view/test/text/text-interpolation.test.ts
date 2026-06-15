import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	name: string;
	count: number;
	active: boolean;
}

const source = `
export default function TextInterpolation($props: { name: string; count: number; active: boolean }) {
	@render {
		<p>Hello, {$props.name}!</p>
		<p>Count: {$props.count}</p>
		<p>Active: {$props.active}</p>
	}
}
`;

test("text interpolation -- mounted", async () => {
	let $state = $watch({ name: "Alice", count: 42, active: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("text interpolation -- hydrated", async () => {
	let $state = $watch({ name: "Alice", count: 42, active: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Hello, Alice!")).not.toBeNull();
	expect(queryByText(container, "Count: 42")).not.toBeNull();
	expect(queryByText(container, "Active: true")).not.toBeNull();

	state.name = "Bob";
	state.count = 0;
	state.active = false;

	expect(queryByText(container, "Hello, Bob!")).not.toBeNull();
	expect(queryByText(container, "Count: 0")).not.toBeNull();
	expect(queryByText(container, "Active: false")).not.toBeNull();
}
