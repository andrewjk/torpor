import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/replace/components/Replace";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	name: string;
}

test("replace -- mounted", async () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("replace -- hydrated", async () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "The replace count is 0.")).not.toBeNull();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).not.toBeNull();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).not.toBeNull();

	$state.name = "c";

	expect(queryByText(container, "The replace count is 2.")).not.toBeNull();
}
