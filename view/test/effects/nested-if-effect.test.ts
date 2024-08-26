import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/NestedIf.tera";

interface State {
	condition: boolean;
	counter: number;
}

test("nested if effect -- mounted", async () => {
	const _state = { condition: true, counter: 0 };
	const state = $watch(_state);

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, _state, state, false);
});

test("nested if effect -- hydrated", async () => {
	const _state = { condition: true, counter: 0 };
	const state = $watch(_state);

	const container = document.createElement("div");
	const path = "./test/effects/components/NestedIf.tera";
	hydrateComponent(container, path, Component, state);

	check(container, _state, state, true);
});

function check(container: HTMLElement, _state: State, state: State, hydrated: boolean) {
	expect(queryByText(container, "It's small")).toBeInTheDocument();

	// 1 state object
	expect(context.objectEffects.size).toBe(hydrated ? 2 : 1);
	// 2 properties
	expect(context.objectEffects.get(_state)).toBeTruthy();
	expect(context.objectEffects.get(_state)!.size).toBe(2);
	// 2 if nodes with effects
	//expect(context.rangeEffects.size).toBe(2);

	state.condition = false;

	expect(queryByText(container, "It's small")).toBeNull();

	// 1 state object
	expect(context.objectEffects.size).toBe(hydrated ? 2 : 1);
	// 1 property
	expect(context.objectEffects.get(_state)).toBeTruthy();
	expect(context.objectEffects.get(_state)!.size).toBe(1);
	// 1 if node with an effect
	//expect(context.rangeEffects.size).toBe(1);
}
