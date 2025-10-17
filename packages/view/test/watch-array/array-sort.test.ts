import "@testing-library/jest-dom/vitest";
import { assert, beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import ArrayState from "./ArrayState";

const componentPath = "./test/watch-array/components/Array";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("array sort -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("array sort -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: ArrayState) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s/g, "")).toBe("^badc$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent.replace(/\s/g, "")).toBe("^abcd$");

	state.items.sort((a, b) => b.text.localeCompare(a.text));

	expect(container.textContent.replace(/\s/g, "")).toBe("^dcba$");
}
