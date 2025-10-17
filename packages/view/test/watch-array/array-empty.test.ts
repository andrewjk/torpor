import "@testing-library/jest-dom/vitest";
import { assert, beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/watch-array/components/Array";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("array empty -- mounted", async () => {
	let $state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("array empty -- hydrated", async () => {
	let $state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s/g, "")).toBe("^$");
}
