import { expect, test } from "vite-plus/test";
import mountComponent from "../mountComponent";
import importComponent from "../importComponent";
import hydrateComponent from "../hydrateComponent";

// `$onmount` callbacks run exactly once per mount: reactive reads inside
// them are not tracked, so state changes never re-run them. The reactive
// part must be wrapped in `$run` instead.
const source = `
export default function OnmountOnce() {
	let $state = $watch({ count: 0 })

	$onmount(() => {
		window.__log.push("onmount:" + $state.count)
	})

	@render {
		<p>Count: {$state.count}</p>
		@function increment() {
			$state.count += 1
		}
		<button id="inc" onclick={increment}>+</button>
	}
}
`;

test("$onmount runs once and does not re-run on state change -- mounted", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect((window as any).__log).toEqual(["onmount:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	incBtn.click();

	expect((window as any).__log).toEqual(["onmount:0"]);
	expect(container.textContent).toContain("Count: 2");
});

test("$onmount runs once and does not re-run on state change -- hydrated", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect((window as any).__log).toEqual(["onmount:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	incBtn.click();

	expect((window as any).__log).toEqual(["onmount:0"]);
	expect(container.textContent).toContain("Count: 2");
});
