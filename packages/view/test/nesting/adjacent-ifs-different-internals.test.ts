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
	c: boolean;
}

const source = `
export default function AdjacentIfsFor($props: { a: boolean; b: boolean; c: boolean }) {
	@render {
		@if ($props.a) {
			<p>A</p>
		}
		@if ($props.b) {
			<ul>
				@for (let i = 0; i < 3; i++) {
					<li>B{i}</li>
				}
			</ul>
		}
		@if ($props.c) {
			@switch (1) {
				case 1: {
					<p>C-on</p>
				}
			}
		}
	}
}
`;

test("adjacent ifs with different internals -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("adjacent ifs with different internals -- hydrated", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "A")).not.toBeNull();
	expect(queryByText(container, "B0")).not.toBeNull();
	expect(queryByText(container, "B1")).not.toBeNull();
	expect(queryByText(container, "B2")).not.toBeNull();
	expect(queryByText(container, "C-on")).not.toBeNull();

	state.a = false;
	expect(queryByText(container, "A")).toBeNull();
	expect(queryByText(container, "B0")).not.toBeNull();
	expect(queryByText(container, "C-on")).not.toBeNull();

	state.b = false;
	expect(queryByText(container, "B0")).toBeNull();
	expect(queryByText(container, "B1")).toBeNull();
	expect(queryByText(container, "B2")).toBeNull();
	expect(queryByText(container, "C-on")).not.toBeNull();

	state.c = false;
	expect(queryByText(container, "C-on")).toBeNull();
}
