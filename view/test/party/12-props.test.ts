import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/UserProfileApp.tera";

test("props -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	document.title = "Document Title";

	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("props -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "My name is John!")).toBeInTheDocument();
	expect(queryByText(container, "My age is 20!")).toBeInTheDocument();
	expect(queryByText(container, "My favourite colors are green, blue, red!")).toBeInTheDocument();
	expect(queryByText(container, "I am available")).toBeInTheDocument();
}
