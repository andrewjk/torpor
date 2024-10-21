import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/ForOf.tera";

test("for of -- mounted", () => {
	const state = $watch({
		items: ["1", "2", "3", "4", "5"],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container);
});

test("for of -- hydrated", () => {
	const state = $watch({
		items: ["1", "2", "3", "4", "5"],
	});

	const container = document.createElement("div");
	const path = "./test/for/components/ForOf.tera";
	hydrateComponent(container, path, Component, state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "5")).not.toBeNull();
	expect(queryByText(container, "6")).toBeNull();
}
