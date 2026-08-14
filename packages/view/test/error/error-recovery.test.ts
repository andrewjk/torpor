import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// The erroring read is inside the @if's control effect, which re-runs after
// the initial render when $props.danger changes
const source = `
export default function ErrorRecovery($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return true;
	}

	@render {
		@if (maybeThrow()) {
			<p>All good</p>
		}
	}

	@error (err) {
		<p class="error">Oops: {err.message}</p>
	}
}
`;

test("error -- catches a later re-render error", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Renders normally first
	expect(queryByText(container, "All good")).not.toBeNull();
	expect(queryByText(container, "Oops: boom")).toBeNull();

	// A re-render error (the render function throws on re-run) must render
	// the @error content instead of breaking the app
	$state.danger = true;

	expect(queryByText(container, "All good")).toBeNull();
	expect(queryByText(container, "Oops: boom")).not.toBeNull();
});

test("error -- recovers when a later re-render error clears", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	$state.danger = true;
	expect(queryByText(container, "Oops: boom")).not.toBeNull();

	// Recovery: the error content must be cleared and the normal content
	// re-rendered
	$state.danger = false;

	expect(queryByText(container, "Oops: boom")).toBeNull();
	expect(queryByText(container, "All good")).not.toBeNull();
});

test("error -- hydrated recovery", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "All good")).not.toBeNull();

	$state.danger = true;
	expect(queryByText(container, "Oops: boom")).not.toBeNull();

	$state.danger = false;
	expect(queryByText(container, "All good")).not.toBeNull();
});
