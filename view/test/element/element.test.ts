import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Element.tera";

interface State {
	tag: string;
}

test("element -- mounted", () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("element -- hydrated", () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	const path = "./test/element/components/Element.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "Hello!")).toBeInTheDocument();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H4");

	$state.tag = "p";

	expect(queryByText(container, "Hello!")?.tagName).toBe("P");
}
