import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	matrix: number[][];
}

const source = `
export default function ForNested($props: { matrix: number[][] }) {
	@render {
		<table>
			@for (let row of $props.matrix) {
				<tr>
					@for (let cell of row) {
						<td>{cell}</td>
					}
				</tr>
			}
		</table>
	}
}
`;

test("for nested -- mounted", async () => {
	let $state = $watch({
		matrix: [
			[1, 2],
			[3, 4],
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for nested -- hydrated", async () => {
	let $state = $watch({
		matrix: [
			[1, 2],
			[3, 4],
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();

	state.matrix = [[10, 20]];

	expect(queryByText(container, "1")).toBeNull();
	expect(queryByText(container, "10")).not.toBeNull();
	expect(queryByText(container, "20")).not.toBeNull();
	expect(queryByText(container, "3")).toBeNull();
}
