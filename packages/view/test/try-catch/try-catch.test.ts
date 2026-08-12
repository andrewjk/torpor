import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function TryCatch($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			@const value = maybeThrow()
			<p>Value: {value}</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("try catch -- catches sync errors on mount", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $watch({ danger: true }));

	checkError(container);
});

test("try catch -- recovers when the error clears", async () => {
	let $state = $watch({ danger: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	checkError(container);

	// The erroring read (`$state.danger`) is read directly by the @try's
	// control effect (via the @const), so flipping it re-runs the try branch,
	// which now succeeds
	$state.danger = false;

	checkOk(container);
});

test("try catch -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $watch({ danger: true }));

	checkError(container);
});

function checkOk(container: HTMLElement) {
	expect(queryByText(container, "Value: ok")).not.toBeNull();
	expect(queryByText(container, "Caught: boom")).toBeNull();
}

function checkError(container: HTMLElement) {
	expect(queryByText(container, "Value: ok")).toBeNull();
	expect(queryByText(container, "Caught: boom")).not.toBeNull();
}
