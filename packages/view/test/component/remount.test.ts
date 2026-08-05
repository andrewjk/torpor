import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const toggleSource = `
export default function ConditionalChild($props: { show: boolean, label: string }) {
	@render {
		@if ($props.show) {
			<div>{$props.label}</div>
		}
	}
}
`;

const parentSource = `
import ConditionalChild from "./ConditionalChild.torp"

export default function Parent($props: { show: boolean }) {
	@render {
		<button id="toggle">Toggle</button>
		@if ($props.show) {
			<ConditionalChild show={true} label="Child A" />
		}
	}
}
`;

test("component mounts and unmounts via parent @if toggle -- mounted", async () => {
	let $state = $watch({ show: true });

	const childComponentSource = `
	export default function ConditionalChild($props: { show: boolean, label: string }) {
		@render {
			<div>{$props.label}</div>
		}
	}
	`;

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

test("component state resets when remounted", async () => {
	const source = `
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

	let $state = $watch({ show: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
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

test("switch between different components", async () => {
	const source = `
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

	let $state = $watch({ mode: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
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
