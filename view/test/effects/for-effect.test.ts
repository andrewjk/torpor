import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import type ProxyData from "../../src/types/ProxyData";
import { proxyDataSymbol } from "../../src/watch/symbols";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/effects/components/For";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("for effect -- mounted", async () => {
	const $state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for effect -- hydrated", async () => {
	const $state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

// HACK: Need to mock context properly
function check(container: HTMLElement, state: any) {
	// `items`
	expect(proxyData(state).propData.size).toBe(1);
	//expect(Object.keys(proxyData(state).propData).length).toBe(1);

	// `iterator`, `length`, `0`, `1`, `2`
	expect(proxyData(state.items).propData.size).toBe(5);
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
