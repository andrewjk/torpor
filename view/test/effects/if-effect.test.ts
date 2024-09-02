import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/If.tera";

test("if effect -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({ counter: 0 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state, false);
});

test("if effect -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({ counter: 0 });

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state, true);
});

// HACK: Need to mock context properly
function check(container: HTMLElement, state: any, hydrated: boolean) {
	expect(queryByText(container, "It's small")).toBeInTheDocument();

	// 1 state object
	expect(context.objectEffects.size).toBe(hydrated ? 2 : 1);

	// 1 if node with an effect
	//expect(context.rangeEffects.size).toBe(1);
}
