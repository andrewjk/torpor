import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function InputFocused() {
	let inputElement: HTMLInputElement;

	$mount(() => {
		// HACK: This is easier to test for
		inputElement.value = "hi";
	});

	@render {
		<input &ref={inputElement} />
	}
}
`;

test("dom ref -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("dom ref -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(input.value).toBe("hi");
}
