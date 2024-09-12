import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array reassign and update -- mounted", () => {
	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array reassign and update -- hydrated", () => {
	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	const path = "./test/watch-array/components/Array.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

	state.items = [
		{ id: 5, text: "e" },
		{ id: 6, text: "f" },
		{ id: 7, text: "g" },
		{ id: 8, text: "h" },
	];

	expect(container.textContent!.replace(/\s/g, "")).toBe("^efgh$");

	state.items.push({ id: 9, text: "i" });

	expect(container.textContent!.replace(/\s/g, "")).toBe("^efghi$");
}
