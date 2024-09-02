import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";

let componentFile = "./components/Array.tera";

test("array sort -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array sort -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^badc$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");
}
