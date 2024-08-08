import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import Component from "./components/For.tera";

test("for effect", async () => {
  const _state = {
    items: [
      { id: 0, text: "first" },
      { id: 1, text: "second" },
      { id: 2, text: "third" },
    ],
  };
  const state = $watch(_state);

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  // 1 state object, 1 array object, 3 array items and 3 $for items
  expect(context.effectSubs.size).toBe(8);

  // 1 for node, 3 items with effects
  expect(context.rangeEffectSubs.size).toBe(4);
});
