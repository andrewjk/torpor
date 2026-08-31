import { expect, test, vi } from "vite-plus/test";
import devContext from "../../src/dev/devContext";
import mountComponent from "../mountComponent";
import importComponent from "../importComponent";

// `$onmount` callbacks run exactly once per mount: reactive reads inside
// them are not tracked, so state changes never re-run them. The reactive
// part must be wrapped in `$run` instead.
const onceSource = `
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

test("$onmount runs once and does not re-run on state change", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, onceSource, "client");
	mountComponent(container, component);

	expect((window as any).__log).toEqual(["onmount:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	incBtn.click();

	expect((window as any).__log).toEqual(["onmount:0"]);
	expect(container.textContent).toContain("Count: 2");
});

// A `$run` nested inside `$onmount` (or `onmount`) picks up the reactivity:
// it runs after the element is in the DOM and re-runs on changes.
const nestedSource = `
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

test("$run nested in $onmount is reactive", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, nestedSource, "client");
	mountComponent(container, component);

	expect((window as any).__log).toEqual(["setup", "run:0"]);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();

	expect((window as any).__log).toEqual(["setup", "run:0", "run:1"]);
	expect(container.querySelector("span")!.textContent).toBe("run 1");
});

test("dev mode warns when an $onmount callback reads reactive state", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, onceSource, "client");

	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const prevEnabled = devContext.enabled;
	devContext.enabled = true;
	try {
		mountComponent(container, component);
	} finally {
		devContext.enabled = prevEnabled;
	}

	expect((window as any).__log).toEqual(["onmount:0"]);
	expect(warn).toHaveBeenCalledTimes(1);
	expect(warn.mock.calls[0][0]).toContain("$run");
	warn.mockRestore();

	// The stray subscriptions were detached, so the callback still never re-runs
	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	expect((window as any).__log).toEqual(["onmount:0"]);
});
