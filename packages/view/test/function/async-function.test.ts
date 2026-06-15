import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test, vi } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AsyncFunctionTest() {
	@render {
		<button id="btn">Click</button>
		<p>Status: idle</p>
		@async function fetchData() {
			window.__asyncResult = "fetched"
		}
	}
}
`;

test("async function defined in template -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Status: idle")).not.toBeNull();
});

test("async function can be called from onclick", async () => {
	const callSource = `
	export default function AsyncCall() {
		@render {
			<button id="btn" onclick={handleClick}>Fetch</button>
			<p>Result: idle</p>
			@async function handleClick() {
				window.__asyncResult = "clicked"
			}
		}
	}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, callSource, "client");
	mountComponent(container, component);

	const btn = container.querySelector("#btn") as HTMLButtonElement;
	btn.click();

	await vi.waitFor(() => {
		expect((window as any).__asyncResult).toBe("clicked");
	});
});

test("async function defined in template -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Status: idle")).not.toBeNull();
});
