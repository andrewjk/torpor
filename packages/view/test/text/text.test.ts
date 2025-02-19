import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/text/components/Text";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	value: string;
	empty: string;
}

test("text -- mounted", async () => {
	const $state = $watch({ value: "hi", empty: "" });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch values -- hydrated", async () => {
	const $state = $watch({ value: "hi", empty: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "hi")).not.toBeNull();

	state.value = "hello";
	state.empty = "world";

	expect(queryByText(container, "hi")).toBeNull();
	expect(queryByText(container, "hello")).not.toBeNull();
	expect(queryByText(container, "world")).not.toBeNull();
}
