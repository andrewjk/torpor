import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/if/components/IfContainingFor";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	condition: boolean;
	counter: number;
}

test("if containing for -- mounted", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing for -- hydrated", async () => {
	let $state = $watch({ condition: false, counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "1!")).toBeNull();
	expect(queryByText(container, "6!")).toBeNull();

	state.condition = true;

	expect(queryByText(container, "1!")).not.toBeNull();
	expect(queryByText(container, "6!")).not.toBeNull();

	state.counter = 3;

	expect(queryByText(container, "1!")).not.toBeNull();
	expect(queryByText(container, "6!")).toBeNull();

	state.condition = false;

	expect(queryByText(container, "1!")).toBeNull();
	expect(queryByText(container, "6!")).toBeNull();
}
