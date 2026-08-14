import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// The try content's only read of $props.danger is inside the text
// interpolation's own $run effect — NOT read directly by the boundary's
// control effect (no @const)
const source = `
export default function TryInterpolation($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			<p>Value: {maybeThrow()}</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("try catch -- routes interpolation effect errors on re-run", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Initially fine
	expect(queryByText(container, "Value: ok")).not.toBeNull();
	expect(queryByText(container, "Caught: boom")).toBeNull();

	// The interpolation's $run effect throws on re-run. This must be routed
	// to the @try boundary (rendering the catch branch) instead of breaking
	// the app
	$state.danger = true;

	expect(queryByText(container, "Value: ok")).toBeNull();
	expect(queryByText(container, "Caught: boom")).not.toBeNull();
});

test("try catch -- recovers from a routed interpolation error", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Route an error, then clear it
	$state.danger = true;
	expect(queryByText(container, "Caught: boom")).not.toBeNull();

	// The erroring read was in a nested $run effect, not read directly by
	// the boundary — recovery must still re-attempt the try branch when the
	// held signal changes
	$state.danger = false;

	expect(queryByText(container, "Caught: boom")).toBeNull();
	expect(queryByText(container, "Value: ok")).not.toBeNull();
});

test("try catch -- re-errors and recovers repeatedly", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	for (const danger of [true, false, true, false]) {
		$state.danger = danger;
		if (danger) {
			expect(queryByText(container, "Caught: boom")).not.toBeNull();
			expect(queryByText(container, "Value: ok")).toBeNull();
		} else {
			expect(queryByText(container, "Value: ok")).not.toBeNull();
			expect(queryByText(container, "Caught: boom")).toBeNull();
		}
	}
});
