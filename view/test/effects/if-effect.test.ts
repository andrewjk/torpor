import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import context from "../../src/watch/internal/context";
import printContext from "../../src/watch/internal/printContext";
import Component from "./components/If.tera";

test("if effect", async () => {
  const state = $watch({ counter: 0 });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's small")).toBeInTheDocument();

  // 1 state object
  expect(context.effectSubs.size).toBe(1);

  // 1 if node with an effect
  expect(context.rangeEffectSubs.size).toBe(1);
});
