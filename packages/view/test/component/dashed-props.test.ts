import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Component() {
	@render {
		<Icon aria-hidden="true" />
	}
}

function Icon($props: { "aria-hidden": string }) {
	@render {
		<i aria-hidden={$props["aria-hidden"]}>i</i>
	}
}
`;

// Regression test: a dashed prop name (e.g. `aria-hidden`) used to be
// emitted as an unquoted object key, which didn't compile
test("dashed prop on a component -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("dashed prop on a component -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	const icon = container.querySelector("i");
	expect(icon).not.toBeNull();
	expect(icon!.getAttribute("aria-hidden")).toBe("true");
}
