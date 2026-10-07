import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `$run` whose body writes state that the render reads. The server compiles
// `$run` to a no-op, so the server HTML reflects the pre-effect values while
// the client's first run applies the effect. This characterizes what hydration
// does with that divergence.
const source = `
export default function RunWritesRenderState() {
	let $state = $watch({ a: 2, b: 0, on: false });
	$run(() => {
		$state.b = $state.a * 2;
		$state.on = $state.a > 1;
	});
	@render {
		<p class="b">{$state.b}</p>
		@if ($state.on) {
			<div class="branch">on</div>
		} else {
			<div class="branch">off</div>
		}
	}
}
`;

test("$run writing render state -- mounted (client)", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, {});

	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "on")).not.toBeNull();
});

test("$run writing render state -- server render", async () => {
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent({});
	// The server no-ops $run, so the pre-effect values are rendered
	expect(body).toContain(">0<");
	expect(body).toContain("off");
});

// KNOWN GAP: the client's first run applies the effect during hydration, but
// an `@if` whose server and client conditions differ is not reconciled -- the
// client adopts the server's branch element and its static content stays
// stale. `test.fails` documents this so it starts passing when the branch
// mismatch is handled.
test.fails("$run writing render state -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");

	await hydrateComponent(container, clientComponent, serverComponent, {});

	// The client's first run applies the effect during hydration; the DOM
	// should end up showing the client values
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "on")).not.toBeNull();
});
