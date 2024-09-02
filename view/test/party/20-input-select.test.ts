import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/ColorSelect.tera";

test("input select -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("input select -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const select = container.getElementsByTagName("select")[0];

	expect(queryByText(container, "Selected: blue")).toBeInTheDocument();

	await user.selectOptions(select, "1");

	expect(queryByText(container, "Selected: red")).toBeInTheDocument();

	await user.selectOptions(select, "3");

	expect(queryByText(container, "Selected: green")).toBeInTheDocument();

	// This shouldn't work because the option is disabled
	await user.selectOptions(select, "4");

	expect(queryByText(container, "Selected: gray")).not.toBeInTheDocument();
	expect(queryByText(container, "Selected: green")).toBeInTheDocument();
}
