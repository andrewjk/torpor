import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/IfElse.tera";

interface State {
	counter: number;
}

test("if true -- mounted", () => {
	const state = $watch({ counter: 10 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("if true -- hydrated", () => {
	const state = $watch({ counter: 10 });

	const container = document.createElement("div");
	const path = "./test/if/components/IfElse.tera";
	hydrateComponent(container, path, Component, state);

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
