import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MountCleanupReturn() {
	let $state = $watch({ mounted: false })

	$onmount(() => {
		$state.mounted = true
		window.__mountLog.push("mount")
		return () => {
			window.__mountLog.push("cleanup")
		}
	})

	@render {
		<p>Mounted: {$state.mounted}</p>
	}
}
`;

test("$onmount runs effect -- mounted", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect((window as any).__mountLog).toContain("mount");
	expect(queryByText(container, "Mounted: true")).not.toBeNull();
});

test("$onmount runs effect -- hydrated", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect((window as any).__mountLog).toContain("mount");
	expect(queryByText(container, "Mounted: true")).not.toBeNull();
});
