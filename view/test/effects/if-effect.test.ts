import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/If.tera";

test("if effect -- mounted", async () => {
  const state = $watch({ counter: 0 });

  const container = document.createElement("div");
  mountComponent(container, Component, state);

  check(container, state, false);
});

test("if effect -- hydrated", async () => {
  const state = $watch({ counter: 0 });

  const container = document.createElement("div");
  const path = "./test/effects/components/If.tera";
  hydrateComponent(container, path, Component, state);

  check(container, state, true);
});

// HACK: Need to mock context properly
function check(container: HTMLElement, state: any, hydrated: boolean) {
  expect(queryByText(container, "It's small")).toBeInTheDocument();

  // 1 state object
  expect(context.objectEffects.size).toBe(hydrated ? 2 : 1);

  // 1 if node with an effect
  //expect(context.rangeEffects.size).toBe(1);
}
