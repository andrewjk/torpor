import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	condition: boolean;
}

const source = `
export default function IfContainingIf($props: { condition: boolean, counter: number }) {
	@render {
		@if ($props.condition) {
			<button onclick={doit}>do it</button>
			@function doit() {
				// it just needs to exist...
			}
		}
	}
}
`;

test("if containing function -- mounted", async () => {
	let $state = $watch({ condition: false });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing function -- hydrated", async () => {
	let $state = $watch({ condition: false });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "do it")).toBeNull();

	state.condition = true;

	expect(queryByText(container, "do it")).not.toBeNull();

	state.condition = false;

	expect(queryByText(container, "do it")).toBeNull();
}
