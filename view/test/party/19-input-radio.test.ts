import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/PickPill.tera";

test("input radio -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("input radio -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/party/components/PickPill.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const blueRadio = container.getElementsByTagName("input")[0];
	const redRadio = container.getElementsByTagName("input")[1];

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();

	await user.click(blueRadio);

	expect(queryByText(container, "Picked: red")).toBeNull();
	expect(queryByText(container, "Picked: blue")).not.toBeNull();

	await user.click(redRadio);

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();
}
