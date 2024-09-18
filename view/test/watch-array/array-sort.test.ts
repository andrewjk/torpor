import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array sort -- mounted", () => {
	const state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array sort -- hydrated", () => {
	const state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const path = "./test/watch-array/components/Array.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^badc$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

	state.items.sort((a, b) => b.text.localeCompare(a.text));

	expect(container.textContent!.replace(/\s/g, "")).toBe("^dcba$");
}
