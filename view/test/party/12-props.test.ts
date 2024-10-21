import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/UserProfileApp.tera";

test("props -- mounted", () => {
	document.title = "Document Title";

	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("props -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/party/components/UserProfileApp.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "My name is John!")).not.toBeNull();
	expect(queryByText(container, "My age is 20!")).not.toBeNull();
	expect(queryByText(container, "My favourite colors are green, blue, red!")).not.toBeNull();
	expect(queryByText(container, "I am available")).not.toBeNull();
}
