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
export default function SeqIfsNested($props: { a: boolean; b: boolean; c: boolean }) {
	@render {
		@if ($props.a) {
			<p>A on</p>
			@if ($props.b) {
				<p>A+B on</p>
				@if ($props.c) {
					<p>A+B+C on</p>
				}
			}
		}
		@if ($props.b) {
			<p>B only section</p>
		}
	}
}
`;

test("sequential ifs with nesting -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("sequential ifs with nesting -- hydrated", async () => {
	let $state = $watch({ a: true, b: true, c: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "A on")).not.toBeNull();
	expect(queryByText(container, "A+B on")).not.toBeNull();
	expect(queryByText(container, "A+B+C on")).not.toBeNull();
	expect(queryByText(container, "B only section")).not.toBeNull();

	state.c = false;
	expect(queryByText(container, "A+B+C on")).toBeNull();
	expect(queryByText(container, "A+B on")).not.toBeNull();

	state.b = false;
	expect(queryByText(container, "A on")).not.toBeNull();
	expect(queryByText(container, "A+B on")).toBeNull();
	expect(queryByText(container, "B only section")).toBeNull();

	state.a = false;
	expect(queryByText(container, "A on")).toBeNull();
	expect(queryByText(container, "A+B on")).toBeNull();
	expect(queryByText(container, "B only section")).toBeNull();

	state.a = true;
	state.b = true;
	state.c = true;
	expect(queryByText(container, "A on")).not.toBeNull();
	expect(queryByText(container, "A+B on")).not.toBeNull();
	expect(queryByText(container, "A+B+C on")).not.toBeNull();
	expect(queryByText(container, "B only section")).not.toBeNull();
}
