import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import type ProxyData from "../../src/types/ProxyData";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/effects/components/If";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("if effect -- mounted", async () => {
	let $state = $watch({ counter: 0 });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if effect -- hydrated", async () => {
	let $state = $watch({ counter: 0 });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: any) {
	expect(queryByText(container, "It's small")).not.toBeNull();

	// `counter`
	expect(proxyData(state).signals.size).toBe(1);
	//expect(Object.keys(proxyData(state).signals).length).toBe(1);
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
