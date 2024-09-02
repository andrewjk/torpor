import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Named.tera";

test("named slot -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("named slot -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "The article's header")).toBeInTheDocument();
	expect(queryByText(container, "The article's body")).toBeInTheDocument();
}
