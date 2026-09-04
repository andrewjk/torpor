import { expect, test, vi } from "vite-plus/test";
import devContext from "../../src/dev/devContext";
import mountComponent from "../mountComponent";
import importComponent from "../importComponent";

// `$onmount` callbacks run exactly once per mount: reactive reads inside
// them are not tracked, so state changes never re-run them. The reactive
// part must be wrapped in `$run` instead.
const source = `
export default function OnmountOnce() {
	let $state = $watch({ count: 0 })

	$onmount(() => {
		// @ts-ignore
		window.__log.push("onmount:" + $state.count)
	})

	@render {
		<p>Count: {$state.count}</p>
		// @ts-ignore
		@function increment() {
			$state.count += 1
		}
		<button id="inc" onclick={increment}>+</button>
	}
}
`;

test("dev mode warns when an $onmount callback reads reactive state", async () => {
	(window as any).__log = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");

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
