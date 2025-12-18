import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	value: number;
}

const source = `
interface Props {
	/** The value to switch on */
	value: number
}

/**
 * A component with a switch statement in it.
 */
export default function Switch($props: Props) {
	@render {
		@switch ($props.value) {
			case 1: {
				<p>
					A small value.
				</p>
			}
			case 100: {
				<p>
					A large value.
				</p>
			}
		}
	}
}`;

test("switch no default -- mounted", async () => {
	let $state = $watch({ value: 1 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch no default -- hydrated", async () => {
	let $state = $watch({ value: 1 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "A small value.")).not.toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();

	state.value = 100;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).not.toBeNull();

	state.value = 500;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
}
