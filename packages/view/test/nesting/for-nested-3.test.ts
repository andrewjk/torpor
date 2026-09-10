import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	matrix: number[][];
	highlight: number;
}

const source = `
export default function ForNested3($props: { matrix: number[][]; highlight: number }) {
	@render {
		<table>
			@for (let row of $props.matrix) {
				<tr>
					@for (let cell of row) {
						<td class={{ active: cell === $props.highlight }}>
							{cell}
						</td>
					}
				</tr>
			}
		</table>
	}
}
`;

test("for nested 3 levels -- mounted", async () => {
	let $state = $watch({
		matrix: [
			[1, 2],
			[3, 4],
			[5, 6],
		],
		highlight: 3,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for nested 3 levels -- hydrated", async () => {
	let $state = $watch({
		matrix: [
			[1, 2],
			[3, 4],
			[5, 6],
		],
		highlight: 3,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "6")).not.toBeNull();

	const cells = container.querySelectorAll("td");
	expect(cells.length).toBe(6);

	// Cell with value 3 should have the "active" class
	const cell3 = Array.from(cells).find((c) => c.textContent?.trim() === "3");
	expect(cell3).toBeDefined();
	expect(cell3!.className).toContain("active");

	state.highlight = 6;
	const cell6 = Array.from(cells).find((c) => c.textContent?.trim() === "6");
	expect(cell6!.className).toContain("active");
	expect(cell3!.className).not.toContain("active");

	state.matrix = [[10], [20, 30]];
	const newCells = container.querySelectorAll("td");
	expect(newCells.length).toBe(3);
	expect(queryByText(container, "10")).not.toBeNull();
	expect(queryByText(container, "30")).not.toBeNull();
}
