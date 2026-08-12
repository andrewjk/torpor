import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
function Thrower() {
	function boom() {
		throw new Error("child boom");
	}

	@render {
		@if (boom()) {
			<p>This is never rendered</p>
		}
	}
}

export default function TryCatchChildError() {
	@render {
		@try {
			<Thrower />
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("try catch -- catches errors from child components", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "This is never rendered")).toBeNull();
	expect(queryByText(container, "Caught: child boom")).not.toBeNull();
});

test("try catch -- child error -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "This is never rendered")).toBeNull();
	expect(queryByText(container, "Caught: child boom")).not.toBeNull();
});
