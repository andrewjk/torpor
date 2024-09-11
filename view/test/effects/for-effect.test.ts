import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import printContext from "../../src/debug/printContext";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/internal/symbols";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/For.tera";

test("for effect -- mounted", async () => {
	const state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("for effect -- hydrated", async () => {
	const state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	const path = "./test/effects/components/For.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

// HACK: Need to mock context properly
function check(container: HTMLElement, state: any) {
	// `items`
	expect(state[proxyDataSymbol].props.size).toBe(1);
	//expect(Object.keys(state[proxyDataSymbol].props).length).toBe(1);

	// `length`, `0`, `1`, `2`
	expect(state.items[proxyDataSymbol].props.size).toBe(4);
	//expect(Object.keys(state.items[proxyDataSymbol].props).length).toBe(4);

	// `text`
	expect(state.items[0][proxyDataSymbol].props.size).toBe(1);
	expect(state.items[1][proxyDataSymbol].props.size).toBe(1);
	expect(state.items[2][proxyDataSymbol].props.size).toBe(1);
	//expect(Object.keys(state.items[0][proxyDataSymbol].props).length).toBe(1);
	//expect(Object.keys(state.items[1][proxyDataSymbol].props).length).toBe(1);
	//expect(Object.keys(state.items[2][proxyDataSymbol].props).length).toBe(1);

	// 1 for node, 3 items with effects
	//expect(context.rangeEffects.size).toBe(4);
}
