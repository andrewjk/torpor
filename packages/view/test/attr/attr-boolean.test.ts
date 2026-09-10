import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AttrBoolean($props: { disabled: boolean; checked: boolean; readonly: boolean }) {
	@render {
		<button disabled={$props.disabled}>Click</button>
		<input type="checkbox" checked={$props.checked} />
		<input type="text" readonly={$props.readonly} />
	}
}
`;

test("boolean attributes -- mounted", async () => {
	let $state = $watch({ disabled: true, checked: false, readonly: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const button = container.querySelector("button")!;
	expect(button).toHaveAttribute("disabled");

	const checkbox = container.querySelector('input[type="checkbox"]')!;
	expect(checkbox).not.toHaveAttribute("checked");

	const textInput = container.querySelector('input[type="text"]')!;
	expect(textInput).toHaveAttribute("readonly");

	$state.disabled = false;
	$state.checked = true;
	$state.readonly = false;

	expect(button).not.toHaveAttribute("disabled");
	expect(checkbox).toHaveAttribute("checked");
	expect(textInput).not.toHaveAttribute("readonly");
});

test("boolean attributes -- hydrated", async () => {
	let $state = $watch({ disabled: true, checked: false, readonly: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const button = container.querySelector("button")!;
	expect(button).toHaveAttribute("disabled");

	$state.disabled = false;
	expect(button).not.toHaveAttribute("disabled");
});
