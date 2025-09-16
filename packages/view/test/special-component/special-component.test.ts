import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/special-component/components/Component";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	self: any;
}

test("special component -- mounted", async () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special component -- hydrated", async () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H2");

	$state.self = "SmallTitle";

	expect(queryByText(container, "Hello!")?.tagName).toBe("H6");
}
