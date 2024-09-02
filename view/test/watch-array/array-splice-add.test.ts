import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";

let componentFile = "./components/Array.tera";

test("array splice add -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array splice add -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

	state.items.splice(1, 0, { id: 5, text: "e" }, { id: 6, text: "f" });

	expect(container.textContent!.replace(/\s/g, "")).toBe("^aefbcd$");
}
