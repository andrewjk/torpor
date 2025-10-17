import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/switch/components/Switch";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	value: number;
}

test("switch values -- mounted", async () => {
	let $state = $watch({ value: 1 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch values -- hydrated", async () => {
	let $state = $watch({ value: 1 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "A small value.")).not.toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 100;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).not.toBeNull();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 500;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).not.toBeNull();
}
