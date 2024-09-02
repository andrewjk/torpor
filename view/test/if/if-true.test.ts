import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/IfElse.tera";

interface State {
	counter: number;
}

test("if true -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({ counter: 10 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("if true -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({ counter: 10 });

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's true!")).toBeInTheDocument();
	expect(queryByText(container, "It's not true...")).toBeNull();

	state.counter = 5;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's not true...")).toBeInTheDocument();

	state.counter = 15;

	expect(queryByText(container, "It's true!")).toBeInTheDocument();
	expect(queryByText(container, "It's not true...")).toBeNull();
}
