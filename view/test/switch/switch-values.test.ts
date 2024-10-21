import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Switch.tera";

interface State {
	value: number;
}

test("switch values -- mounted", () => {
	const state = $watch({ value: 1 });

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("switch values -- hydrated", () => {
	const state = $watch({ value: 1 });

	const container = document.createElement("div");
	const path = "./test/switch/components/Switch.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "A small value.")).not.toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 100;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).not.toBeNull();
	expect(queryByText(container, "Another value.")).toBeNull();

	state.value = 500;

	expect(queryByText(container, "A small value.")).toBeNull();
	expect(queryByText(container, "A large value.")).toBeNull();
	expect(queryByText(container, "Another value.")).not.toBeNull();
}
