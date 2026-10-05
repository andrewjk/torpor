import { queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface State {
	mounted: boolean;
	sections: Record<string, { tabs: { id: number; text: string }[] }>;
}

// Minimal repro of the tab bar bug. It differs from a plain keyed `@for` in
// `@if` in two ways that mattered:
//  - the `@if` condition calls a function returning a length: `tabs().length > 1`
//  - the `@for` iterates a function that returns a nested array: `tabs()`
// When the condition went true -> false -> true, the list didn't come back.
const source = `
export default function IfRetoggle($props: { mounted: boolean; sections: Record<string, { tabs: { id: number; text: string }[] }> }) {
	function tabs(): { id: number; text: string }[] {
		return $props.sections["admin"]?.tabs ?? [];
	}

	@render {
		@if ($props.mounted && tabs().length > 1) {
			<ul>
				@for (let tab of tabs()) {
					@key = tab.id
					<li>{tab.text}</li>
				}
			</ul>
		}
	}
}
`;

function initial(): State {
	return {
		mounted: true,
		sections: {
			admin: {
				tabs: [
					{ id: 1, text: "A" },
					{ id: 2, text: "B" },
				],
			},
		},
	};
}

test("if re-toggle with function-returned keyed for -- mounted", async () => {
	const $state = $watch(initial());

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if re-toggle with function-returned keyed for -- hydrated", async () => {
	const $state = $watch(initial());

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "A")).not.toBeNull();
	expect(queryByText(container, "B")).not.toBeNull();

	// Close a tab: one left, so the `@if` hides the list
	state.sections.admin.tabs = [{ id: 1, text: "A" }];
	expect(queryByText(container, "A")).toBeNull();

	// Open another tab: two again, the list should come back
	state.sections.admin.tabs = [
		{ id: 1, text: "A" },
		{ id: 2, text: "B" },
	];
	expect(queryByText(container, "A")).not.toBeNull();
	expect(queryByText(container, "B")).not.toBeNull();

	// And still update after the re-toggle
	state.sections.admin.tabs = [
		{ id: 1, text: "A" },
		{ id: 2, text: "B" },
		{ id: 3, text: "C" },
	];
	expect(queryAllByText(container, "A")).toHaveLength(1);
	expect(queryByText(container, "C")).not.toBeNull();
}
