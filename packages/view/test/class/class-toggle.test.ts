import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	active: boolean;
	emphasis: boolean;
}

const source = `
export default function ClassToggle($props: { active: boolean; emphasis: boolean }) {
	@render {
		<p class={{ active: $props.active, emphasis: $props.emphasis, base: true }}>
			Toggle class
		</p>
	}
}
`;

test("class toggle -- mounted", async () => {
	let $state = $watch({ active: true, emphasis: false });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("class toggle -- hydrated", async () => {
	let $state = $watch({ active: true, emphasis: false });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const el = queryByText(container, "Toggle class")!;
	expect(el).toHaveClass("active base");

	state.emphasis = true;
	expect(el).toHaveClass("active emphasis base");

	state.active = false;
	expect(el).toHaveClass("emphasis base");

	state.active = true;
	state.emphasis = false;
	expect(el).toHaveClass("active base");
}
