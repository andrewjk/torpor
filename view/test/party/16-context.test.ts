import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/UserProfileContextApp.tera";

test("context -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("context -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/party/components/UserProfileContextApp.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const button = container.getElementsByTagName("button")[0];

	expect(queryByText(container, "Welcome back, unicorn42")).not.toBeNull();
	expect(queryByText(container, "Username: unicorn42")).not.toBeNull();

	await user.click(button);

	expect(queryByText(container, "Welcome back, Jane")).not.toBeNull();
	expect(queryByText(container, "Username: Jane")).not.toBeNull();
}
