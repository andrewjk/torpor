import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/IfAfterIf.tera";

interface State {
	counter: number;
}

test("if after if -- mounted", () => {
	const state = $watch({ counter: 8 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("if after if -- hydrated", () => {
	const state = $watch({ counter: 8 });

	const container = document.createElement("div");
	const path = "./test/if/components/IfAfterIf.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 12;

	expect(queryByText(container, "It's true!")).not.toBeNull();
	expect(queryByText(container, "It's also true!")).not.toBeNull();

	state.counter = 3;

	expect(queryByText(container, "It's true!")).toBeNull();
	expect(queryByText(container, "It's also true!")).toBeNull();
}
