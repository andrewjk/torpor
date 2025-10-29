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
export default function IfElseIf($props: { counter: number }) {
	@render {
		@if ($props.counter > 10) {
			<p>
				It's over ten!
			</p>
		} else if ($props.counter > 5) {
			<p>
				It's over five!
			</p>
		} else {
			<p>
				It's not there yet
			</p>
		}
	}
}
`;

test("else if true -- mounted", async () => {
	let $state = $watch({ counter: 3 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("else if true -- hydrated", async () => {
	let $state = $watch({ counter: 3 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "It's not there yet")).not.toBeNull();
	expect(queryByText(container, "It's over five!")).toBeNull();
	expect(queryByText(container, "It's over ten!")).toBeNull();

	state.counter = 8;

	expect(queryByText(container, "It's not there yet")).toBeNull();
	expect(queryByText(container, "It's over five!")).not.toBeNull();
	expect(queryByText(container, "It's over ten!")).toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's not there yet")).toBeNull();
	expect(queryByText(container, "It's over five!")).toBeNull();
	expect(queryByText(container, "It's over ten!")).not.toBeNull();
}
