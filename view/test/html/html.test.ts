import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Html.tera";

interface State {
	html: string;
}

test("html -- mounted", () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("html -- hydrated", () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	const path = "./test/html/components/Html.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "I'm strong and emphasised")).not.toBeNull();
	expect(queryByText(container, "I'm strong and emphasised")?.outerHTML).toBe(
		"<em>I'm strong and emphasised</em>",
	);

	$state.html = "<ul><li>A list</li></ul>";

	expect(queryByText(container, "A list")).not.toBeNull();
}
