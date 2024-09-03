import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/InputHello.tera";

test("input text -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("input text -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/party/components/InputHello.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const input = container.getElementsByTagName("input")[0];

	expect(queryByText(container, "Hello World")).toBeInTheDocument();

	await user.clear(input);
	await user.type(input, "Hello Jane");

	expect(queryByText(container, "Hello Jane")).toBeInTheDocument();
}
