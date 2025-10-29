import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	level: number;
}

const source = `
export default function Self($props: { level: number }) {
	@render {
		<p>Level {$props.level}</p>
		@if ($props.level < 3) {
			<Self level={$props.level + 1} />
		}
	}
}
`;

test("special self -- mounted", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special self -- hydrated", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, _: Props) {
	expect(queryByText(container, "Level 1")).not.toBeNull();
	expect(queryByText(container, "Level 2")).not.toBeNull();
	expect(queryByText(container, "Level 3")).not.toBeNull();
	expect(queryByText(container, "Level 4")).toBeNull();
}
