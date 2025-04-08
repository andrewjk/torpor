import { queryByRole } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/svg/components/Shape";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	name: string;
}

test("svg -- mounted", async () => {
	const $state = $watch({ name: "rect" });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("svg -- hydrated", async () => {
	const $state = $watch({ name: "rect" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	const img = queryByRole(container, "img");
	expect(img).not.toBeNull();

	expect(img).toContainHTML('<rect width="100" height="100" fill="red"></rect>');

	state.name = "circle";

	expect(img).toContainHTML('<circle r="45" cx="50" cy="50" fill="red"></circle>');
}
