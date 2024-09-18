import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";
import Component from "./components/ArrayIndexes.tera";

test("array indexes -- mounted", () => {
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

test("array indexes -- hydrated", () => {
	const state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const path = "./test/watch-array/components/ArrayIndexes.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	// TODO: Should have spaces between letter items
	expect(container.textContent!.replace(/\s/g, "")).toBe("^b,a,d,c$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent!.replace(/\s/g, "")).toBe("^a,b,c,d$");

	state.items[1].text = "e";

	expect(container.textContent!.replace(/\s/g, "")).toBe("^a,e,c,d$");
}
