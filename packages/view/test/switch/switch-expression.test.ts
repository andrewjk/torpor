import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	score: number;
}

const source = `
export default function SwitchExpr($props: { score: number }) {
	@render {
		@switch (Math.floor($props.score / 10)) {
			case 0: {
				<p>F</p>
			}
			case 1: {
				<p>D</p>
			}
			case 2: {
				<p>C</p>
			}
			case 3: {
				<p>B</p>
			}
			default: {
				<p>A</p>
			}
		}
	}
}
`;

test("switch expression -- mounted", async () => {
	let $state = $watch({ score: 5 });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch expression -- hydrated", async () => {
	let $state = $watch({ score: 5 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "F")).not.toBeNull();

	state.score = 15;
	expect(queryByText(container, "D")).not.toBeNull();
	expect(queryByText(container, "F")).toBeNull();

	state.score = 25;
	expect(queryByText(container, "C")).not.toBeNull();

	state.score = 35;
	expect(queryByText(container, "B")).not.toBeNull();

	state.score = 42;
	expect(queryByText(container, "A")).not.toBeNull();
}
