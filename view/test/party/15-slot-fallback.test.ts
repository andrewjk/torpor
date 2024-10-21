import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/FunnyButtonApp.tera";

test("slot fallback -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("slot fallback -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/party/components/FunnyButtonApp.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "No content found")).not.toBeNull();
}
