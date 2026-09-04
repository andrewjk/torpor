import { expect, test } from "vite-plus/test";
import mountComponent from "../mountComponent";
import importComponent from "../importComponent";
import hydrateComponent from "../hydrateComponent";

// A `$run` nested inside `$onmount` (or `onmount`) picks up the reactivity:
// it runs after the element is in the DOM and re-runs on changes.
const source = `
export default function OnmountNestedRun() {
	let $state = $watch({ count: 0 })
	let label: HTMLElement

	$onmount(() => {
		window.__log.push("setup")
		$run(() => {
			window.__log.push("run:" + $state.count)
			label.textContent = "run " + $state.count
		})
	})

	@render {
		<span &ref={label}></span>
		@function increment() {
			$state.count += 1
		}
		<button id="inc" onclick={increment}>+</button>
	}
}
`;

test("$run nested in $onmount is reactive -- mounted", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect((window as any).__log).toEqual(["setup", "run:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();

	expect((window as any).__log).toEqual(["setup", "run:0", "run:1"]);
	expect(container.querySelector("span")!.textContent).toBe("run 1");
});

test("$run nested in $onmount is reactive -- hydrated", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect((window as any).__log).toEqual(["setup", "run:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();

	expect((window as any).__log).toEqual(["setup", "run:0", "run:1"]);
	expect(container.querySelector("span")!.textContent).toBe("run 1");
});
