import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const parentComponentSource = `
export default function Parent($props: { show: boolean }) {
	let $state = $watch({ label: "Child A" })

	@render {
		<button id="toggle">Toggle</button>
		@if ($props.show) {
			<div>{$state.label}</div>
		}
	}
}
`;

test("component mounts and unmounts via parent @if toggle -- mounted", async () => {
	let $parentState = $watch({ show: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, parentComponentSource, "client");
	mountComponent(container, component, $parentState);

	expect(queryByText(container, "Child A")).not.toBeNull();

	$parentState.show = false;
	expect(queryByText(container, "Child A")).toBeNull();

	$parentState.show = true;
	expect(queryByText(container, "Child A")).not.toBeNull();
});

test("component mounts and unmounts via parent @if toggle -- hydrated", async () => {
	let $parentState = $watch({ show: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(
		import.meta.filename,
		parentComponentSource,
		"client",
	);
	const serverComponent = await importComponent(
		import.meta.filename,
		parentComponentSource,
		"server",
	);
	await hydrateComponent(container, clientComponent, serverComponent, $parentState);

	expect(queryByText(container, "Child A")).not.toBeNull();

	$parentState.show = false;
	expect(queryByText(container, "Child A")).toBeNull();

	$parentState.show = true;
	expect(queryByText(container, "Child A")).not.toBeNull();
});

const remountSource = `
export default function RemountTest($props: { show: boolean }) {
	let $state = $watch({ count: 0 })

	@render {
		<button id="inc" onclick={increment}>+</button>
		<p>Count: {$state.count}</p>
		@function increment() {
			$state.count += 1
		}
		@if ($props.show) {
			<div id="conditional">Visible</div>
		}
	}
}
`;

test("component state resets when remounted -- mounted", async () => {
	let $state = $watch({ show: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, remountSource, "client");
	mountComponent(container, component, $state);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	incBtn.click();
	incBtn.click();

	expect(queryByText(container, "Count: 3")).not.toBeNull();

	// Toggle off and on - state should NOT reset because only a div is toggled
	$state.show = false;
	expect(container.querySelector("#conditional")).toBeNull();

	$state.show = true;
	expect(container.querySelector("#conditional")).not.toBeNull();
	expect(queryByText(container, "Count: 3")).not.toBeNull();
});

test("component state resets when remounted -- hydrated", async () => {
	let $state = $watch({ show: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, remountSource, "client");
	const serverComponent = await importComponent(import.meta.filename, remountSource, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const incBtn = container.querySelector("#inc") as HTMLButtonElement;
	incBtn.click();
	incBtn.click();
	incBtn.click();

	expect(queryByText(container, "Count: 3")).not.toBeNull();

	// Toggle off and on - state should NOT reset because only a div is toggled
	$state.show = false;
	expect(container.querySelector("#conditional")).toBeNull();

	$state.show = true;
	expect(container.querySelector("#conditional")).not.toBeNull();
	expect(queryByText(container, "Count: 3")).not.toBeNull();
});

const switchSource = `
export default function SwitchComponent($props: { mode: string }) {
	@render {
		@switch ($props.mode) {
			case "a": {
				<div id="a">Mode A</div>
			}
			case "b": {
				<div id="b">Mode B</div>
			}
			default: {
				<div id="default">Default</div>
			}
		}
	}
}
`;

test("switch between different components -- mounted", async () => {
	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, switchSource, "client");
	mountComponent(container, component, $state);

	expect(container.querySelector("#a")).not.toBeNull();
	expect(container.querySelector("#b")).toBeNull();

	$state.mode = "b";
	expect(container.querySelector("#a")).toBeNull();
	expect(container.querySelector("#b")).not.toBeNull();

	$state.mode = "c";
	expect(container.querySelector("#b")).toBeNull();
	expect(container.querySelector("#default")).not.toBeNull();

	$state.mode = "a";
	expect(container.querySelector("#a")).not.toBeNull();
	expect(container.querySelector("#default")).toBeNull();
});

test("switch between different components -- hydrated", async () => {
	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, switchSource, "client");
	const serverComponent = await importComponent(import.meta.filename, switchSource, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(container.querySelector("#a")).not.toBeNull();
	expect(container.querySelector("#b")).toBeNull();

	$state.mode = "b";
	expect(container.querySelector("#a")).toBeNull();
	expect(container.querySelector("#b")).not.toBeNull();

	$state.mode = "c";
	expect(container.querySelector("#b")).toBeNull();
	expect(container.querySelector("#default")).not.toBeNull();

	$state.mode = "a";
	expect(container.querySelector("#a")).not.toBeNull();
	expect(container.querySelector("#default")).toBeNull();
});
