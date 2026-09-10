import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import unmount from "../../src/render/unmount";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function UnmountTest() {
	$onmount(() => {
		window.__unmountLog.push("mount")
		return () => {
			window.__unmountLog.push("cleanup")
		}
	})

	@render {
		<p id="content">Hello</p>
	}
}
`;

test("unmount clears the container and runs $onmount cleanups", async () => {
	(window as any).__unmountLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(container.querySelector("#content")).not.toBeNull();
	expect((window as any).__unmountLog).toContain("mount");

	unmount(container);

	expect(container.querySelector("#content")).toBeNull();
	expect(container.childNodes.length).toBe(0);
	expect((window as any).__unmountLog).toContain("cleanup");
});

test("unmount clears the container and runs cleanups -- hydrated", async () => {
	(window as any).__unmountLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect(container.querySelector("#content")).not.toBeNull();
	expect((window as any).__unmountLog).toContain("mount");

	unmount(container);

	expect(container.querySelector("#content")).toBeNull();
	expect(container.childNodes.length).toBe(0);
	expect((window as any).__unmountLog).toContain("cleanup");
});

test("mounting again after unmount works (fresh re-mount)", async () => {
	(window as any).__unmountLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);
	unmount(container);

	// Without unmount this would throw "must have no child elements" because
	// #app still holds the previous render's children.
	mountComponent(container, component);

	expect(container.querySelector("#content")).not.toBeNull();
	expect(queryByText(container, "Hello")).not.toBeNull();
	expect((window as any).__unmountLog).toEqual(["mount", "cleanup", "mount"]);
});

test("mounting again after unmount works -- hydrated then mounted", async () => {
	(window as any).__unmountLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);
	unmount(container);

	mountComponent(container, clientComponent);

	expect(container.querySelector("#content")).not.toBeNull();
	expect(queryByText(container, "Hello")).not.toBeNull();
});
