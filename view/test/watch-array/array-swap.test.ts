import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array swap -- mounted", () => {
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

test("array swap -- hydrated", () => {
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

	const clone = state.items.slice();
	const tmp = clone[1];
	clone[1] = clone[3];
	clone[3] = tmp;
	state.items = clone;

	expect(container.textContent!.replace(/\s/g, "")).toBe("^adcb$");
}
