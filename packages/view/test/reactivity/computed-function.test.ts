import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ComputedGetter($props: { count: number }) {
	@render {
		<p>Count: {$props.count}</p>
		<p>Doubled: {$props.count * 2}</p>
		<p>Quadrupled: {$props.count * 4}</p>
	}
}
`;

test("computed expressions in template -- mounted", async () => {
	let $state = $watch({ count: 5 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Count: 5")).not.toBeNull();
	expect(queryByText(container, "Doubled: 10")).not.toBeNull();
	expect(queryByText(container, "Quadrupled: 20")).not.toBeNull();

	$state.count = 10;
	expect(queryByText(container, "Count: 10")).not.toBeNull();
	expect(queryByText(container, "Doubled: 20")).not.toBeNull();
	expect(queryByText(container, "Quadrupled: 40")).not.toBeNull();

	$state.count = 0;
	expect(queryByText(container, "Doubled: 0")).not.toBeNull();
});

test("computed expressions in template -- hydrated", async () => {
	let $state = $watch({ count: 5 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Doubled: 10")).not.toBeNull();

	$state.count = 7;
	expect(queryByText(container, "Doubled: 14")).not.toBeNull();
});
