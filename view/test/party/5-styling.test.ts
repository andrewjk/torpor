import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/CssStyle.tera";

test("minimal template -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("minimal template -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/party/components/CssStyle.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "I am red")).toHaveClass("title");
	expect(queryByText(container, "I am a button")).toHaveStyle("font-size: 10rem");
}
