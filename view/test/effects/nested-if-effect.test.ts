import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import type ProxyData from "../../src/types/ProxyData";
import { proxyDataSymbol } from "../../src/watch/symbols";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/effects/components/NestedIf";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	condition: boolean;
	counter: number;
}

test("nested if effect -- mounted", async () => {
	const $state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("nested if effect -- hydrated", async () => {
	const $state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's small")).not.toBeNull();

	// `condition`, `counter`
	expect(proxyData(state).propData.size).toBe(2);
	expect(proxyData(state).propData.get("condition")?.effects?.length).toBe(1);
	expect(proxyData(state).propData.get("counter")?.effects?.length).toBe(1);
	//expect(Object.keys(proxyData(state).propData).length).toBe(2);

	state.condition = false;

	expect(queryByText(container, "It's small")).toBeNull();

	// `condition`
	expect(proxyData(state).propData.size).toBe(2);
	expect(proxyData(state).propData.get("condition")?.effects?.length).toBe(1);
	expect(proxyData(state).propData.get("counter")?.effects?.length).toBe(0);
	//expect(Object.keys(proxyData(state).propData).length).toBe(1);
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
