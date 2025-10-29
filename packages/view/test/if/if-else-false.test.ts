import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	counter: number;
}

const source = `
export default function IfElse($props: { counter: number }) {
	@render {
		@if ($props.counter > 7) {
			<p>
				It's true!
			</p>
			<p>
				That's right
			</p>
		} else {
			<p>
				It's not true...
			</p>
		}
	}
}
`;

test("if else false -- mounted", async () => {
	let $state = $watch({ counter: 5 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if else false -- hydrated", async () => {
	let $state = $watch({ counter: 5 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's not true...")).not.toBeNull();

	state.counter = 10;

	expect(queryByText(container, "It's true!")).not.toBeNull();
	expect(queryByText(container, "It's not true...")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's not true...")).not.toBeNull();
}
