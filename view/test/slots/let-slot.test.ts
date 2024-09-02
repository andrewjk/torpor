import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Let.tera";

test("let slot -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container);
});

test("let slot -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
	});

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "item 1")).toBeInTheDocument();
	expect(queryByText(container, "item 2")).toBeInTheDocument();
	expect(queryByText(container, "item 3")).toBeInTheDocument();
}
