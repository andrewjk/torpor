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
			@for (let i = 0; i < $props.counter; i++) {
				<p>{i}!</p>
			}
		}
	}
}
`;

test("if containing for -- mounted", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing for -- hydrated", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "1!")).toBeNull();
	expect(queryByText(container, "6!")).toBeNull();

	state.condition = true;

	expect(queryByText(container, "1!")).not.toBeNull();
	expect(queryByText(container, "6!")).not.toBeNull();

	state.counter = 3;

	expect(queryByText(container, "1!")).not.toBeNull();
	expect(queryByText(container, "6!")).toBeNull();

	state.condition = false;

	expect(queryByText(container, "1!")).toBeNull();
	expect(queryByText(container, "6!")).toBeNull();
}
