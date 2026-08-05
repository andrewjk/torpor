import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	count: number;
}

const source = `
export default function IfElseIf($props: { count: number }) {
	@render {
		@if ($props.count < 0) {
			<p>Negative</p>
		} else if ($props.count === 0) {
			<p>Zero</p>
		} else if ($props.count < 10) {
			<p>Small positive</p>
		} else {
			<p>Large positive</p>
		}
	}
}
`;

test("if else-if chain -- mounted", async () => {
	let $state = $watch({ count: -5 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if else-if chain -- hydrated", async () => {
	let $state = $watch({ count: -5 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Negative")).not.toBeNull();
	expect(queryByText(container, "Zero")).toBeNull();
	expect(queryByText(container, "Small positive")).toBeNull();
	expect(queryByText(container, "Large positive")).toBeNull();

	state.count = 0;
	expect(queryByText(container, "Negative")).toBeNull();
	expect(queryByText(container, "Zero")).not.toBeNull();

	state.count = 5;
	expect(queryByText(container, "Small positive")).not.toBeNull();
	expect(queryByText(container, "Zero")).toBeNull();

	state.count = 100;
	expect(queryByText(container, "Large positive")).not.toBeNull();
	expect(queryByText(container, "Small positive")).toBeNull();

	state.count = -1;
	expect(queryByText(container, "Negative")).not.toBeNull();
}
