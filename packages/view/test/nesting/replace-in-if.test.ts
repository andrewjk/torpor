import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	counter: number;
	show: boolean;
}

const source = `
export default function ReplaceInIf($props: { counter: number; show: boolean }) {
	@render {
		@if ($props.show) {
			@replace ($props.counter) {
				<p>Replaced: {$props.counter}</p>
			}
		} else {
			<p>Hidden</p>
		}
	}
}
`;

test("replace in if -- mounted", async () => {
	let $state = $watch({ counter: 0, show: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("replace in if -- hydrated", async () => {
	let $state = $watch({ counter: 0, show: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Replaced: 0")).not.toBeNull();
	expect(queryByText(container, "Hidden")).toBeNull();

	state.counter = 1;
	expect(queryByText(container, "Replaced: 1")).not.toBeNull();

	state.show = false;
	expect(queryByText(container, "Replaced: 1")).toBeNull();
	expect(queryByText(container, "Hidden")).not.toBeNull();

	state.show = true;
	state.counter = 2;
	expect(queryByText(container, "Replaced: 2")).not.toBeNull();
}
