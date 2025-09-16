import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/special-self/components/Self";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	level: number;
}

test("special self -- mounted", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special self -- hydrated", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, _: State) {
	expect(queryByText(container, "Level 1")).not.toBeNull();
	expect(queryByText(container, "Level 2")).not.toBeNull();
	expect(queryByText(container, "Level 3")).not.toBeNull();
	expect(queryByText(container, "Level 4")).toBeNull();
}
