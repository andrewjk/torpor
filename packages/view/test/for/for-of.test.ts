import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForOf";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for of -- mounted", async () => {
	let $state = $watch({
		items: ["1", "2", "3", "4", "5"],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("for of -- hydrated", async () => {
	let $state = $watch({
		items: ["1", "2", "3", "4", "5"],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "5")).not.toBeNull();
	expect(queryByText(container, "6")).toBeNull();
}
