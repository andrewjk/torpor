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
export default function SeqIfs($props: { a: boolean; b: boolean; c: boolean }) {
	@render {
		@if ($props.a) {
			<p>A on</p>
		}
		@if ($props.b) {
			<p>B on</p>
		}
		@if ($props.c) {
			<p>C on</p>
		}
	}
}
`;

test("sequential ifs -- mounted", async () => {
	let $state = $watch({ a: true, b: false, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("sequential ifs -- hydrated", async () => {
	let $state = $watch({ a: true, b: false, c: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "A on")).not.toBeNull();
	expect(queryByText(container, "B on")).toBeNull();
	expect(queryByText(container, "C on")).not.toBeNull();

	state.a = false;
	state.b = true;
	expect(queryByText(container, "A on")).toBeNull();
	expect(queryByText(container, "B on")).not.toBeNull();
	expect(queryByText(container, "C on")).not.toBeNull();

	state.c = false;
	expect(queryByText(container, "A on")).toBeNull();
	expect(queryByText(container, "B on")).not.toBeNull();
	expect(queryByText(container, "C on")).toBeNull();

	state.a = true;
	state.b = true;
	state.c = true;
	expect(queryByText(container, "A on")).not.toBeNull();
	expect(queryByText(container, "B on")).not.toBeNull();
	expect(queryByText(container, "C on")).not.toBeNull();
}
