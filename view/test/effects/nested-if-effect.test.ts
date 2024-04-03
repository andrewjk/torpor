import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import Component from "./components/NestedIf.tera";

test("nested if effect", async () => {
  const _state = { condition: true, counter: 0 };
  const state = $watch(_state);

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's small")).toBeInTheDocument();

  // 1 state object
  expect(context.effectSubs.size).toBe(1);
  // 2 properties
  expect(context.effectSubs.get(_state)).toBeTruthy();
  expect(context.effectSubs.get(_state)!.size).toBe(2);
  // 2 if nodes with effects
  expect(context.rangeEffectSubs.size).toBe(2);

  state.condition = false;

  expect(queryByText(container, "It's small")).toBeNull();

  // 1 state object
  expect(context.effectSubs.size).toBe(1);
  // 1 property
  expect(context.effectSubs.get(_state)).toBeTruthy();
  expect(context.effectSubs.get(_state)!.size).toBe(1);
  // 1 if node with an effect
  expect(context.rangeEffectSubs.size).toBe(1);
});
