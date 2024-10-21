import { getByText, queryByText, waitFor, waitForElementToBeRemoved } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Await.tera";

test("await -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("await -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/await/components/Await.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await user.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await user.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Hmm...")).toBeNull();
	expect(queryByText(container, "Something went wrong: uh oh!")).not.toBeNull();
}
