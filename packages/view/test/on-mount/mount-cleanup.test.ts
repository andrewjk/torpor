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

test("$onmount runs effect on mount", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect((window as any).__mountLog).toContain("mount");
	expect(queryByText(container, "Mounted: true")).not.toBeNull();
});

test("$onmount with multiple mount effects run in order", async () => {
	(window as any).__mountLog = [];

	const multiSource = `
	export default function MultiMount() {
		$onmount(() => {
			window.__mountLog.push("first")
		})
		$onmount(() => {
			window.__mountLog.push("second")
		})
		$onmount(() => {
			window.__mountLog.push("third")
		})

		@render {
			<p>Multi</p>
		}
	}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, multiSource, "client");
	mountComponent(container, component);

	expect((window as any).__mountLog).toEqual(["first", "second", "third"]);
});

test("$onmount hydrates correctly", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Mounted: true")).not.toBeNull();
	expect((window as any).__mountLog).toContain("mount");
});
