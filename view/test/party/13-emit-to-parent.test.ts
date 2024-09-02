import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/AnswerButtonApp.tera";

test("emit to parent -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("emit to parent -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const yesButton = container.getElementsByTagName("button")[0];
	const noButton = container.getElementsByTagName("button")[1];

	expect(queryByText(container, "😀")).toBeInTheDocument();
	expect(queryByText(container, "😥")).not.toBeInTheDocument();

	await user.click(noButton);

	expect(queryByText(container, "😀")).not.toBeInTheDocument();
	expect(queryByText(container, "😥")).toBeInTheDocument();

	await user.click(yesButton);

	expect(queryByText(container, "😀")).toBeInTheDocument();
	expect(queryByText(container, "😥")).not.toBeInTheDocument();
}
