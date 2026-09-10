import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function NumberInput($props: { value: number }) {
	@render {
		<input type="number" &value={$props.value}>
		<p>Value: {$props.value}</p>
	}
}
`;

test("number input reflects state -- mounted", async () => {
	let $state = $watch({ value: 42 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;
	expect(input.value).toBe("42");
});

test("number input state updates from input -- mounted", async () => {
	let $state = $watch({ value: 0 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;

	input.value = "99";
	input.dispatchEvent(new Event("input", { bubbles: true }));

	expect($state.value).toBe(99);
});

test("number input state change updates input -- mounted", async () => {
	let $state = $watch({ value: 0 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;

	$state.value = 123;
	expect(input.value).toBe("123");
});

test("number input with negative value -- mounted", async () => {
	let $state = $watch({ value: -5 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;
	expect(input.value).toBe("-5");
});

test("number input clears to empty -- mounted", async () => {
	let $state = $watch({ value: 0 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;

	input.value = "";
	input.dispatchEvent(new Event("input", { bubbles: true }));
});

test("number input -- hydrated", async () => {
	let $state = $watch({ value: 42 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	let input = container.querySelector("input") as HTMLInputElement;
	expect(input.value).toBe("42");
});
