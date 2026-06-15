import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	level: number;
	on: boolean;
}

const source = `
export default function DeepNesting($props: { level: number; on: boolean }) {
	@render {
		@if ($props.level >= 1) {
			<p>L1</p>
			@if ($props.level >= 2) {
				<p>L2</p>
				@if ($props.level >= 3) {
					<p>L3</p>
					@if ($props.level >= 4) {
						<p>L4</p>
					}
				}
			}
		}
		@if ($props.on) {
			<p>On flag</p>
		}
	}
}
`;

test("deep nesting -- mounted", async () => {
	let $state = $watch({ level: 4, on: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("deep nesting -- hydrated", async () => {
	let $state = $watch({ level: 4, on: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "L1")).not.toBeNull();
	expect(queryByText(container, "L2")).not.toBeNull();
	expect(queryByText(container, "L3")).not.toBeNull();
	expect(queryByText(container, "L4")).not.toBeNull();
	expect(queryByText(container, "On flag")).not.toBeNull();

	state.level = 2;
	expect(queryByText(container, "L1")).not.toBeNull();
	expect(queryByText(container, "L2")).not.toBeNull();
	expect(queryByText(container, "L3")).toBeNull();
	expect(queryByText(container, "L4")).toBeNull();

	state.level = 0;
	expect(queryByText(container, "L1")).toBeNull();
	expect(queryByText(container, "L2")).toBeNull();
	expect(queryByText(container, "L3")).toBeNull();
	expect(queryByText(container, "L4")).toBeNull();

	state.on = false;
	expect(queryByText(container, "On flag")).toBeNull();

	state.level = 3;
	state.on = true;
	expect(queryByText(container, "L1")).not.toBeNull();
	expect(queryByText(container, "L2")).not.toBeNull();
	expect(queryByText(container, "L3")).not.toBeNull();
	expect(queryByText(container, "L4")).toBeNull();
	expect(queryByText(container, "On flag")).not.toBeNull();
}
