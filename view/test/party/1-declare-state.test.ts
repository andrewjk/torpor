import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Name.tera";

test("declare state -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("declare state -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/party/components/Name.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Hello John")).not.toBeNull();
}
