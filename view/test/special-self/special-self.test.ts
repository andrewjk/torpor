import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Self.tera";

interface State {
	level: number;
}

test("special self -- mounted", () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("special self -- hydrated", () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const path = "./test/special-self/components/Self.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "Level 1")).toBeInTheDocument();
	expect(queryByText(container, "Level 2")).toBeInTheDocument();
	expect(queryByText(container, "Level 3")).toBeInTheDocument();
	expect(queryByText(container, "Level 4")).not.toBeInTheDocument();
}
