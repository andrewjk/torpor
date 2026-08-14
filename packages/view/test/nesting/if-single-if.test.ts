import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// An outer `@if` whose body is a single control: the outer branch region
// owns only the inner control's anchor comment when the inner condition is
// false. Widening is not specific to `@for` rows — clearing the outer branch
// must also remove content the inner `@if` rendered on a later re-run.

const source = `
export default function IfSingleIf($props: { outer: boolean, inner: boolean }) {
	@render {
		<div>
			@if ($props.outer) {
				@if ($props.inner) {
					<p>both</p>
				}
			}
		</div>
		<footer>after</footer>
	}
}
`;

function run(container: HTMLElement, state: { outer: boolean; inner: boolean }) {
	expect(container.querySelectorAll("p").length).toBe(0);

	// Outer on, inner off: outer branch owns only the inner anchor
	state.outer = true;
	assertRegionChain();
	expect(container.querySelectorAll("p").length).toBe(0);

	// Inner on via a later control re-run: content inserted at the anchor,
	// outside the outer branch's original window — must be widened
	state.inner = true;
	assertRegionChain();
	expect(container.querySelector("p")).toHaveTextContent("both");

	// Inner off: branch cleared
	state.inner = false;
	assertRegionChain();
	expect(container.querySelectorAll("p").length).toBe(0);

	// Inner on again, then outer off: clearing the outer branch must remove
	// the inner content (this is the orphan check)
	state.inner = true;
	assertRegionChain();
	expect(container.querySelector("p")).toHaveTextContent("both");

	state.outer = false;
	assertRegionChain();
	expect(container.querySelectorAll("p").length).toBe(0);

	// And the whole cycle again to be sure regions were released cleanly
	state.inner = false;
	state.outer = true;
	assertRegionChain();
	expect(container.querySelectorAll("p").length).toBe(0);

	state.inner = true;
	assertRegionChain();
	expect(container.querySelector("p")).toHaveTextContent("both");

	expect(container.querySelector("footer")).toHaveTextContent("after");
}

test("outer if with single inner if widens and clears correctly -- mounted", async () => {
	let $state = $watch({ outer: false, inner: false });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	run(container, $state);
});

test("outer if with single inner if widens and clears correctly -- hydrated", async () => {
	let $state = $watch({ outer: false, inner: false });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	run(container, $state);
});
