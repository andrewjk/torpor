import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	condition: boolean;
	counter: number;
}

const source = `
export default function IfContainingIf($props: { condition: boolean, counter: number }) {
	@render {
		@if ($props.condition) {
			@if ($props.counter > 5) {
				<p>It's big</p>
			} else {
				<p>It's small</p>
			}
		}
	}
}
`;

test("if containing if -- mounted", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing if -- hydrated", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();

	state.condition = true;

	expect(queryByText(container, "It's big")).not.toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).not.toBeNull();

	state.condition = false;

	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();
}
