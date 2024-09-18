import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Replace.tera";

interface State {
	name: string;
}

test("replace -- mounted", () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("replace -- hydrated", () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	const path = "./test/replace/components/Replace.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "The replace count is 0.")).toBeInTheDocument();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).toBeInTheDocument();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).toBeInTheDocument();

	$state.name = "c";

	expect(queryByText(container, "The replace count is 2.")).toBeInTheDocument();
}
