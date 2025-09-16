import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/if/components/IfAfterIf";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	counter: number;
}

test("if after if -- mounted", async () => {
	const $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if after if -- hydrated", async () => {
	const $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's true!")).not.toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).toBeNull();
}
