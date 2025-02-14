import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/slots/components/Let";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("let slot -- mounted", async () => {
	const $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("let slot -- hydrated", async () => {
	const $state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "item 1")).not.toBeNull();
	expect(queryByText(container, "item 2")).not.toBeNull();
	expect(queryByText(container, "item 3")).not.toBeNull();
}
