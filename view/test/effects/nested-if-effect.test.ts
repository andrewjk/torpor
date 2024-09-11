import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/internal/symbols";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/NestedIf.tera";

interface State {
	condition: boolean;
	counter: number;
}

test("nested if effect -- mounted", async () => {
	const state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("nested if effect -- hydrated", async () => {
	const state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	const path = "./test/effects/components/NestedIf.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "It's small")).toBeInTheDocument();

	// `condition`, `counter`
	expect(state[proxyDataSymbol].props.size).toBe(2);
	//expect(Object.keys(state[proxyDataSymbol].props).length).toBe(2);

	// 2 if nodes with effects
	//expect(context.rangeEffects.size).toBe(2);

	state.condition = false;

	expect(queryByText(container, "It's small")).toBeNull();

	// `condition`
	expect(state[proxyDataSymbol].props.size).toBe(1);
	//expect(Object.keys(state[proxyDataSymbol].props).length).toBe(1);

	// 1 if node with an effect
	//expect(context.rangeEffects.size).toBe(1);
}
