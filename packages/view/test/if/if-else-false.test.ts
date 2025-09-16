import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/if/components/IfElse";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	counter: number;
}

test("if else false -- mounted", async () => {
	const $state = $watch({ counter: 5 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if else false -- hydrated", async () => {
	const $state = $watch({ counter: 5 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's not true...")).not.toBeNull();

	state.counter = 10;

	expect(queryByText(container, "It's true!")).not.toBeNull();
	expect(queryByText(container, "It's not true...")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's not true...")).not.toBeNull();
}
