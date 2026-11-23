import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	item: { name: string } | undefined;
}

const source = `
export default function Component($props: { item: { name: string } | undefined }) {
	@render {
		@if ($props.item) {
			<p>{$props.item!.name}</p>
		}
	}
}
`;

// Regression test: when an @if condition turns false, the branch's bindings
// used to run one more time (reading state that's already gone, e.g.
// `item!.name` after `item` became undefined) before the branch was removed
test("if bindings don't run when condition turns false -- mounted", async () => {
	let $state: Props = $watch({ item: { name: "Amy" } });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if bindings don't run when condition turns false -- hydrated", async () => {
	let $state: Props = $watch({ item: { name: "Amy" } });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Amy")).not.toBeNull();

	// Turning the condition false must not re-run the branch's bindings —
	// they'd read `item.name` on a now-undefined item (and used to throw)
	state.item = undefined;

	expect(queryByText(container, "Amy")).toBeNull();

	// And back again
	state.item = { name: "Bob" };
	expect(queryByText(container, "Bob")).not.toBeNull();
}
