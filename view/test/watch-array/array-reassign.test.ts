import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";

const componentPath = "./test/watch-array/components/Array";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("array reassign and update -- mounted", async () => {
	const $state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("array reassign and update -- hydrated", async () => {
	const $state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

	state.items = [
		{ id: 5, text: "e" },
		{ id: 6, text: "f" },
		{ id: 7, text: "g" },
		{ id: 8, text: "h" },
	];

	expect(container.textContent!.replace(/\s/g, "")).toBe("^efgh$");

	state.items.push({ id: 9, text: "i" });

	expect(container.textContent!.replace(/\s/g, "")).toBe("^efghi$");
}
