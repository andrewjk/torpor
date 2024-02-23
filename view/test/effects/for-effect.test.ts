import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import context from "../../src/watch/internal/context";
import watch from "../../src/watch/watch";
import Component from "./components/For.tera";

test("for effect", async () => {
  const _state = {
    items: [
      { id: 0, text: "first" },
      { id: 1, text: "second" },
      { id: 2, text: "third" },
    ],
  };
  const state = watch(_state);

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  // 1 state object, 1 array object and 3 array items
  expect(context.effectSubscriptions.size).toBe(5);
  // 1 component, 1 for node, 3 items
  expect(context.rangeEffects.size).toBe(5);
});
