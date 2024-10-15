import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import type ProxyData from "../../src/types/ProxyData";
import { proxyDataSymbol } from "../../src/watch/symbols";
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
	expect(proxyData(state).propData.size).toBe(1);
	//expect(Object.keys(proxyData(state).propData).length).toBe(1);

	// `length`, `0`, `1`, `2`
	expect(proxyData(state.items).propData.size).toBe(4);
	//expect(Object.keys(proxyData(state.items).propData).length).toBe(4);

	// `text`
	expect(proxyData(state.items[0]).propData.size).toBe(1);
	expect(proxyData(state.items[1]).propData.size).toBe(1);
	expect(proxyData(state.items[2]).propData.size).toBe(1);
	//expect(Object.keys(proxyData(state.items[0]).propData).length).toBe(1);
	//expect(Object.keys(proxyData(state.items[1]).propData).length).toBe(1);
	//expect(Object.keys(proxyData(state.items[2]).propData).length).toBe(1);

	// 1 for node, 3 items with effects
	//expect(context.rangeEffects.size).toBe(4);
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
