import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/if/components/IfContainingIf";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	condition: boolean;
	counter: number;
}

test("if containing if -- mounted", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing if -- hydrated", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();

	state.condition = true;

	expect(queryByText(container, "It's big")).not.toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).not.toBeNull();

	state.condition = false;

	expect(queryByText(container, "It's big")).toBeNull();
	expect(queryByText(container, "It's small")).toBeNull();
}
