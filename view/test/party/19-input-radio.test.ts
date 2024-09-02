import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/PickPill.tera";

test("input radio -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("input radio -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const blueRadio = container.getElementsByTagName("input")[0];
	const redRadio = container.getElementsByTagName("input")[1];

	expect(queryByText(container, "Picked: red")).toBeInTheDocument();
	expect(queryByText(container, "Picked: blue")).not.toBeInTheDocument();

	await user.click(blueRadio);

	expect(queryByText(container, "Picked: red")).not.toBeInTheDocument();
	expect(queryByText(container, "Picked: blue")).toBeInTheDocument();

	await user.click(redRadio);

	expect(queryByText(container, "Picked: red")).toBeInTheDocument();
	expect(queryByText(container, "Picked: blue")).not.toBeInTheDocument();
}
