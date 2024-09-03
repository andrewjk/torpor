import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Basic.tera";

test("basic slot -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("basic slot -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/slots/components/Basic.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Basic stuff")).toBeInTheDocument();
	expect(queryByText(container, "Default header...")).toBeNull();
}
