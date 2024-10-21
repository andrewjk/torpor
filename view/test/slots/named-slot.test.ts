import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Named.tera";

test("named slot -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("named slot -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/slots/components/Named.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "The article's header")).not.toBeNull();
	expect(queryByText(container, "The article's body")).not.toBeNull();
}
