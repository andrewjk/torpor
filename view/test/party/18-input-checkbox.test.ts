import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/IsAvailable.tera";

test("input checkbox -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("input checkbox -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/party/components/IsAvailable.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const input = container.getElementsByTagName("input")[0];

	expect(queryByText(container, "Not available")).toBeInTheDocument();

	await user.click(input);

	expect(queryByText(container, "Available")).toBeInTheDocument();
}
