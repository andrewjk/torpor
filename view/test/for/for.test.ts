import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/For.tera";

test("for -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("for -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0")).toBeInTheDocument();
	expect(queryByText(container, "1")).toBeInTheDocument();
	expect(queryByText(container, "2")).toBeInTheDocument();
	expect(queryByText(container, "3")).toBeInTheDocument();
	expect(queryByText(container, "4")).toBeInTheDocument();
	expect(queryByText(container, "5")).toBeNull();
}
