import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MountCleanupReturn() {
	let $state = $watch({ mounted: false })

	$mount(() => {
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

test("$mount runs effect on mount", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect((window as any).__mountLog).toContain("mount");
	expect(queryByText(container, "Mounted: true")).not.toBeNull();
});

test("$mount with multiple mount effects run in order", async () => {
	(window as any).__mountLog = [];

	const multiSource = `
	export default function MultiMount() {
		$mount(() => {
			window.__mountLog.push("first")
		})
		$mount(() => {
			window.__mountLog.push("second")
		})
		$mount(() => {
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

test("$mount hydrates correctly", async () => {
	(window as any).__mountLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Mounted: true")).not.toBeNull();
	expect((window as any).__mountLog).toContain("mount");
});
