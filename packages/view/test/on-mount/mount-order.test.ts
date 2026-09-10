import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MountOrder() {
	let $state = $watch({ order: "" });

	$onmount(() => {
		(window as any).__mountLog.push("first");
		$state.order = (window as any).__mountLog.join(", ");
	});

	$onmount(() => {
		(window as any).__mountLog.push("second");
		$state.order = (window as any).__mountLog.join(", ");
	});

	$onmount(() => {
		(window as any).__mountLog.push("third");
		$state.order = (window as any).__mountLog.join(", ");
	});

	@render {
		<p>Mount order: {$state.order}</p>
	}
}
`;

test("mount order -- mounted", async () => {
	(window as any).__mountLog = [];
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Mount order: first, second, third")).not.toBeNull();
});

test("mount order -- hydrated", async () => {
	(window as any).__mountLog = [];
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Mount order: first, second, third")).not.toBeNull();
});
