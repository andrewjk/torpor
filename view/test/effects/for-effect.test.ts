import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import printContext from "../../src/debug/printContext";
import context from "../../src/global/context";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/For.tera";

test("for effect -- mounted", async () => {
	const _state = {
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	};
	const state = $watch(_state);

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state, false);
});

test("for effect -- hydrated", async () => {
	const _state = {
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	};
	const state = $watch(_state);

	const container = document.createElement("div");
	const path = "./test/effects/components/For.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state, true);
});

// HACK: Need to mock context properly
function check(container: HTMLElement, state: any, hydrated: boolean) {
	// 1 state object, 1 array object, 3 array items and 3 for items
	expect(context.objectEffects.size).toBe(hydrated ? 16 : 8);

	// 1 for node, 3 items with effects
	//expect(context.rangeEffects.size).toBe(4);
}
