import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	active: boolean;
}

const source = `
export default function StyleToggle($props: { active: boolean }) {
	@render {
		<div style={{ color: $props.active ? "green" : "red" }}>
			Toggle style
		</div>
	}
}
`;

test("style toggle -- mounted", async () => {
	let $state = $watch({ active: true });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("style toggle -- hydrated", async () => {
	let $state = $watch({ active: true });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const el = queryByText(container, "Toggle style")!;
	expect(el).toHaveStyle({ color: "rgb(0, 128, 0)" });

	state.active = false;
	expect(el).toHaveStyle({ color: "rgb(255, 0, 0)" });

	state.active = true;
	expect(el).toHaveStyle({ color: "rgb(0, 128, 0)" });
}
