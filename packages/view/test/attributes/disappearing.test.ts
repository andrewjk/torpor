import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	thing: any;
	dataThing: any;
}

const source = `
export default function Attributes() {
	@render {
		<div
			thing={$props.thing}
			data-thing={$props.dataThing}
			caption="this attribute is for {$props.description}"
			{$props.attr}
		>
			Hello!
		</div>
	}
}
`;

test("attributes disappearing -- mounted", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("attributes disappearing -- hydrated", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "thing2");

	state.thing = false;
	state.dataThing = false;

	expect(queryByText(container, "Hello!")).not.toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).not.toHaveAttribute("data-thing", "thing2");

	state.thing = "back";
	state.dataThing = "again";

	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "back");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "again");

	state.thing = null;
	state.dataThing = undefined;

	expect(queryByText(container, "Hello!")).not.toHaveAttribute("thing");
	expect(queryByText(container, "Hello!")).not.toHaveAttribute("data-thing");
}
