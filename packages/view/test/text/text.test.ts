import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	value: string;
	empty: string;
}

const source = `
 export default function Text($props: {
	value: string;
	empty: string;
}) {
	@render {
		<p>
			{$props.value}
		</p>
		@// Make sure the #text element to be set is not null if the value is empty
		<p>{$props.empty}</p>
	}
}
`;

test("text -- mounted", async () => {
	let $state = $watch({ value: "hi", empty: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch values -- hydrated", async () => {
	let $state = $watch({ value: "hi", empty: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "hi")).not.toBeNull();

	state.value = "hello";
	state.empty = "world";

	expect(queryByText(container, "hi")).toBeNull();
	expect(queryByText(container, "hello")).not.toBeNull();
	expect(queryByText(container, "world")).not.toBeNull();
}
