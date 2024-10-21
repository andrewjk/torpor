import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/TrafficLight.tera";

test("conditional -- mounted", async () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	await check(container);
});

test("conditional -- hydrated", async () => {
	const container = document.createElement("div");
	const path = "./test/party/components/TrafficLight.tera";
	hydrateComponent(container, path, Component);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();

	expect(queryByText(container, "STOP")).not.toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	const button = container.getElementsByTagName("button")[0];
	await user.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).not.toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	await user.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).not.toBeNull();
}
