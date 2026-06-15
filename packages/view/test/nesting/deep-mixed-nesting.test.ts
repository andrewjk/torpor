import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	a: boolean;
	b: boolean;
	c: boolean;
	d: boolean;
	e: boolean;
}

const source = `
export default function DeepMixed($props: { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean }) {
	@render {
		@if ($props.a) {
			<p>Level 1</p>
			@if ($props.b) {
				<p>Level 2</p>
				@if ($props.c) {
					<p>Level 3</p>
					@if ($props.d) {
						<p>Level 4</p>
						@if ($props.e) {
							<p>Level 5</p>
						}
					}
				}
			}
		}
		@if ($props.a && $props.e) {
			<p>A+E</p>
		}
	}
}
`;

test("deep mixed nesting -- mounted", async () => {
	let $state = $watch({ a: true, b: true, c: true, d: true, e: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("deep mixed nesting -- hydrated", async () => {
	let $state = $watch({ a: true, b: true, c: true, d: true, e: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Level 1")).not.toBeNull();
	expect(queryByText(container, "Level 2")).not.toBeNull();
	expect(queryByText(container, "Level 3")).not.toBeNull();
	expect(queryByText(container, "Level 4")).not.toBeNull();
	expect(queryByText(container, "Level 5")).not.toBeNull();
	expect(queryByText(container, "A+E")).not.toBeNull();

	state.e = false;
	expect(queryByText(container, "Level 5")).toBeNull();
	expect(queryByText(container, "A+E")).toBeNull();
	expect(queryByText(container, "Level 4")).not.toBeNull();

	state.d = false;
	expect(queryByText(container, "Level 4")).toBeNull();
	expect(queryByText(container, "Level 3")).not.toBeNull();

	state.c = false;
	expect(queryByText(container, "Level 3")).toBeNull();
	expect(queryByText(container, "Level 2")).not.toBeNull();

	state.b = false;
	expect(queryByText(container, "Level 2")).toBeNull();
	expect(queryByText(container, "Level 1")).not.toBeNull();

	state.a = false;
	expect(queryByText(container, "Level 1")).toBeNull();

	// Toggle back up — need b=true for Level 3 to show
	state.a = true;
	state.b = true;
	state.c = true;
	state.e = true;
	expect(queryByText(container, "Level 1")).not.toBeNull();
	expect(queryByText(container, "Level 2")).not.toBeNull();
	expect(queryByText(container, "Level 3")).not.toBeNull();
	expect(queryByText(container, "A+E")).not.toBeNull();
	expect(queryByText(container, "Level 4")).toBeNull();
	expect(queryByText(container, "Level 5")).toBeNull();
}
