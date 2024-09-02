import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Switch.tera";

interface State {
	value: number;
}

test("switch values -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({ value: 1 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("switch values -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({ value: 1 });

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "A small value.")).toBeInTheDocument();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 100;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).toBeInTheDocument();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 500;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).toBeInTheDocument();
}
