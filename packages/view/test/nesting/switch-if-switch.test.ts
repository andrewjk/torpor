import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	level: string;
	kind: string;
}

const source = `
export default function SwitchInsideIfInsideSwitch($props: { level: string; kind: string }) {
	@render {
		@switch ($props.level) {
			case "top": {
				@if ($props.kind === "a") {
					@switch ($props.kind) {
						case "a": {
							<p>Top A1</p>
						}
						default: {
							<p>Top A-default</p>
						}
					}
				} else {
					<p>Top other</p>
				}
			}
			case "bottom": {
				<p>Bottom</p>
			}
			default: {
				<p>Fallback</p>
			}
		}
	}
}
`;

test("switch inside if inside switch -- mounted", async () => {
	let $state = $watch({ level: "top", kind: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch inside if inside switch -- hydrated", async () => {
	let $state = $watch({ level: "top", kind: "a" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Top A1")).not.toBeNull();

	state.kind = "b";
	expect(queryByText(container, "Top A1")).toBeNull();
	expect(queryByText(container, "Top other")).not.toBeNull();

	state.level = "bottom";
	expect(queryByText(container, "Top other")).toBeNull();
	expect(queryByText(container, "Bottom")).not.toBeNull();

	state.level = "unknown";
	expect(queryByText(container, "Fallback")).not.toBeNull();
	expect(queryByText(container, "Bottom")).toBeNull();

	state.level = "top";
	state.kind = "a";
	expect(queryByText(container, "Top A1")).not.toBeNull();
}
