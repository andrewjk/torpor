import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/if/components/IfElseIf";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	counter: number;
}

test("else if true -- mounted", async () => {
	let $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("else if true -- hydrated", async () => {
	let $state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's not there yet")).toBeNull();
	expect(queryByText(container, "It's over five!")).not.toBeNull();
	expect(queryByText(container, "It's over ten!")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's not there yet")).not.toBeNull();
	expect(queryByText(container, "It's over five!")).toBeNull();
	expect(queryByText(container, "It's over ten!")).toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's not there yet")).toBeNull();
	expect(queryByText(container, "It's over five!")).toBeNull();
	expect(queryByText(container, "It's over ten!")).not.toBeNull();
}
