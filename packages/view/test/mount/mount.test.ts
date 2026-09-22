import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
import mount from "../../src/render/mount";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Mount() {
	let inputElement: HTMLInputElement;

	$onmount(() => {
		inputElement.value = "hi";
	});

	@render {
		<input &ref={inputElement} />
	}
}
`;

test("mount -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("mount -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

test("mount -- SSR component throws", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "server");

	expect(() => mount(container, component)).toThrow(/compiled for SSR/);
	expect(container.childElementCount).toBe(0);
	expect(container.firstChild).toBe(null);
});

test("hydrate -- SSR component throws", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "server");

	expect(() => hydrate(container, component)).toThrow(/compiled for SSR/);
	expect(container.firstChild).toBe(null);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(input.value).toBe("hi");
}
