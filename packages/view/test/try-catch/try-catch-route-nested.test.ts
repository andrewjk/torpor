import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// An interpolation whose $run effect throws on re-run, with NO boundary
const unhandledSource = `
export default function Unhandled($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		<p>Value: {maybeThrow()}</p>
	}
}
`;

// Nested boundaries: a routed error inside the inner boundary's try content
// must go to the inner catch, not the outer one
const nestedSource = `
export default function NestedBoundaries($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			@try {
				<p>Inner: {maybeThrow()}</p>
			} catch (inner) {
				<p class="inner">Inner caught: {inner.message}</p>
			}
		} catch (outer) {
			<p class="outer">Outer caught: {outer.message}</p>
		}
	}
}
`;

test("effect error without a boundary still propagates", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, unhandledSource, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Value: ok")).not.toBeNull();

	// No boundary anywhere: the error must keep propagating out of the write
	// (pre-boundary behaviour)
	expect(() => {
		$state.danger = true;
	}).toThrow("boom");
});

test("nested boundaries -- routed error goes to the nearest boundary", async () => {
	const $state = $watch({ danger: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, nestedSource, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Inner: ok")).not.toBeNull();

	$state.danger = true;

	expect(queryByText(container, "Inner caught: boom")).not.toBeNull();
	expect(queryByText(container, "Outer caught: boom")).toBeNull();

	$state.danger = false;

	expect(queryByText(container, "Inner: ok")).not.toBeNull();
	expect(queryByText(container, "Inner caught: boom")).toBeNull();
});
