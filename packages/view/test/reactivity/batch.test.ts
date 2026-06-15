import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $batch from "../../src/watch/$batch";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BatchTest($props: { a: number; b: number; c: number }) {
	@render {
		<p>A: {$props.a}</p>
		<p>B: {$props.b}</p>
		<p>C: {$props.c}</p>
		<p>Sum: {$props.a + $props.b + $props.c}</p>
	}
}
`;

test("$batch groups updates -- mounted", async () => {
	let $state = $watch({ a: 1, b: 2, c: 3 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Sum: 6")).not.toBeNull();

	$batch(() => {
		$state.a = 10;
		expect(queryByText(container, "Sum: 6")).not.toBeNull(); // not updated yet
		$state.b = 20;
		expect(queryByText(container, "Sum: 6")).not.toBeNull(); // not updated yet
		$state.c = 30;
	});

	// After batch, all updates should be applied
	expect(queryByText(container, "A: 10")).not.toBeNull();
	expect(queryByText(container, "B: 20")).not.toBeNull();
	expect(queryByText(container, "C: 30")).not.toBeNull();
	expect(queryByText(container, "Sum: 60")).not.toBeNull();
});

test("$batch groups updates -- hydrated", async () => {
	let $state = $watch({ a: 1, b: 2, c: 3 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	$batch(() => {
		$state.a = 100;
		$state.b = 200;
	});

	expect(queryByText(container, "A: 100")).not.toBeNull();
	expect(queryByText(container, "B: 200")).not.toBeNull();
});
