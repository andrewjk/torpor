import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/UserProfileContextApp.tera";

test("context -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("context -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const button = container.getElementsByTagName("button")[0];

	expect(queryByText(container, "Welcome back, unicorn42")).toBeInTheDocument();
	expect(queryByText(container, "Username: unicorn42")).toBeInTheDocument();

	await user.click(button);

	expect(queryByText(container, "Welcome back, Jane")).toBeInTheDocument();
	expect(queryByText(container, "Username: Jane")).toBeInTheDocument();
}
