import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: string[];
	toggle: boolean;
}

const source = `
export default function SwitchInIf($props: { items: string[]; toggle: boolean }) {
	@render {
		@if ($props.toggle) {
			@for (let item of $props.items) {
				<p>{item}</p>
			}
		} else {
			<p>Off</p>
		}
	}
}
`;

test("switch in if (for in if) -- mounted", async () => {
	let $state = $watch({ items: ["one", "two", "three"], toggle: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch in if (for in if) -- hydrated", async () => {
	let $state = $watch({ items: ["one", "two", "three"], toggle: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "one")).not.toBeNull();
	expect(queryByText(container, "two")).not.toBeNull();
	expect(queryByText(container, "three")).not.toBeNull();
	expect(queryByText(container, "Off")).toBeNull();

	state.toggle = false;
	expect(queryByText(container, "one")).toBeNull();
	expect(queryByText(container, "Off")).not.toBeNull();

	state.items = ["x", "y"];
	state.toggle = true;
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "y")).not.toBeNull();
	expect(queryByText(container, "one")).toBeNull();
}
