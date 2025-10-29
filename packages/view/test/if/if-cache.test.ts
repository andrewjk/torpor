import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	counter: number;
	i: number;
}

const source = `
export default function IfCache($props: { counter: number, i: number }) {
	@render {
		@if ($props.counter < 5) {
			<p onmount={() => $props.i++;}>
				It's small!
			</p>
		} else {
			<p>
				It's not small...
			</p>
		}
	}
}
`;

test("if else false -- mounted", async () => {
	let $state = $watch({ counter: 1, i: 0 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if else false -- hydrated", async () => {
	let $state = $watch({ counter: 1, i: 0 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	// HACK: onmount gets run twice!
	expect(state.i).toBe(2);

	expect(queryByText(container, "It's small!")).not.toBeNull();
	expect(queryByText(container, "It's not small...")).toBeNull();

	expect(state.i).toBe(2);
	state.counter = 1;
	expect(state.i).toBe(2);
	state.counter = 2;
	expect(state.i).toBe(2);
	state.counter = 3;
	expect(state.i).toBe(2);

	state.counter = 6;
	expect(state.i).toBe(2);

	expect(queryByText(container, "It's small!")).toBeNull();
	expect(queryByText(container, "It's not small...")).not.toBeNull();

	state.counter = 3;
	expect(state.i).toBe(4);

	expect(queryByText(container, "It's small!")).not.toBeNull();
	expect(queryByText(container, "It's not small...")).toBeNull();
}
