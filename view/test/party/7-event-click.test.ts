import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Counter.tera";

test("event click -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("event click -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();

	expect(queryByText(container, "Counter: 0")).toBeInTheDocument();

	const button = container.getElementsByTagName("button")[0];
	await user.click(button);

	expect(queryByText(container, "Counter: 1")).toBeInTheDocument();
}
