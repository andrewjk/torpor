import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";

let componentFile = "./components/Array.tera";

test("array empty -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array empty -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^$");
}
