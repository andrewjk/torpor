import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	matrix: number[][];
	operation: string;
}

const source = `
export default function ForSwitchFor($props: { matrix: number[][]; operation: string }) {
	@render {
		@for (let row of $props.matrix) {
			<div class="row">
				@switch ($props.operation) {
					case "sum": {
						<p>{row.reduce((a, b) => a + b, 0)}</p>
					}
					case "max": {
						<p>{Math.max(...row)}</p>
					}
					case "items": {
						@for (let cell of row) {
							<span>{cell} </span>
						}
					}
					default: {
						<p>Unknown op</p>
					}
				}
			>
		</div>
		}
	}
}
`;

test("for switch for -- mounted", async () => {
	let $state = $watch({
		matrix: [
			[1, 2, 3],
			[4, 5, 6],
		],
		operation: "sum",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for switch for -- hydrated", async () => {
	let $state = $watch({
		matrix: [
			[1, 2, 3],
			[4, 5, 6],
		],
		operation: "sum",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const rows = container.querySelectorAll(".row");
	expect(rows.length).toBe(2);

	// Sum: row1 = 6, row2 = 15
	expect(queryByText(container, "6")).not.toBeNull();
	expect(queryByText(container, "15")).not.toBeNull();

	state.operation = "max";
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "6")).not.toBeNull();

	state.operation = "items";
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "5")).not.toBeNull();

	state.matrix = [[10, 20]];
	state.operation = "sum";
	const newRows = container.querySelectorAll(".row");
	expect(newRows.length).toBe(1);
	expect(queryByText(container, "30")).not.toBeNull();
}
