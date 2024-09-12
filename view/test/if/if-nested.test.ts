import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/IfNested.tera";

interface State {
	counter: number;
}

test("if nested -- mounted", () => {
	const state = $watch({ counter: 8 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("if nested -- hydrated", () => {
	const state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const path = "./test/if/components/IfNested.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).toBeInTheDocument();
	expect(queryByText(container, "The first is not true!")).toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's both true!")).toBeInTheDocument();
	expect(queryByText(container, "The second is not true!")).toBeNull();
	expect(queryByText(container, "The first is not true!")).toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).toBeNull();
	expect(queryByText(container, "The first is not true!")).toBeInTheDocument();
}
