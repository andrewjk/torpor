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
export default function IfAfterIf($props: { counter: number }) {
	@render {
		@if ($props.counter > 10) {
			<p>
				It's true!
			</p>
		}
		@if ($props.counter > 5) {
			<p>
				It's also true!
			</p>
		}
	}
}
`;

test("if after if -- mounted", async () => {
	let $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if after if -- hydrated", async () => {
	let $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's true!")).not.toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).toBeNull();
}
