import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	name: string;
}

const source = `
export default function ReplaceSame($props: { name: string }) {
	let counter = 0;

	@render {
		@replace ($props.name) {
			<p>Render count: {counter++}</p>
		}
	}
}
`;

test("replace same value -- mounted", async () => {
	let $state = $watch({ name: "same" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("replace same value -- hydrated", async () => {
	let $state = $watch({ name: "same" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Render count: 0")).not.toBeNull();

	// Setting the same value should NOT re-render
	state.name = "same";
	expect(queryByText(container, "Render count: 0")).not.toBeNull();

	// Different value should re-render
	state.name = "other";
	expect(queryByText(container, "Render count: 1")).not.toBeNull();
}
