import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	a: boolean;
	b: boolean;
}

const source = `
export default function IfNested($props: { a: boolean; b: boolean }) {
	@render {
		@if ($props.a) {
			<p>A is true</p>
			@if ($props.b) {
				<p>B is true</p>
			} else {
				<p>B is false</p>
			}
		} else {
			<p>A is false</p>
		}
	}
}
`;

test("if nested -- mounted", async () => {
	let $state = $watch({ a: true, b: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if nested -- hydrated", async () => {
	let $state = $watch({ a: true, b: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "A is true")).not.toBeNull();
	expect(queryByText(container, "B is true")).not.toBeNull();
	expect(queryByText(container, "A is false")).toBeNull();

	state.b = false;
	expect(queryByText(container, "A is true")).not.toBeNull();
	expect(queryByText(container, "B is true")).toBeNull();
	expect(queryByText(container, "B is false")).not.toBeNull();

	state.a = false;
	expect(queryByText(container, "A is true")).toBeNull();
	expect(queryByText(container, "A is false")).not.toBeNull();
	expect(queryByText(container, "B is false")).toBeNull();

	state.a = true;
	state.b = true;
	expect(queryByText(container, "A is true")).not.toBeNull();
	expect(queryByText(container, "B is true")).not.toBeNull();
}
