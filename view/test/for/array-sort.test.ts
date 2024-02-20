import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array sort", () => {
  const state = watch({
    items: [
      { id: 1, text: "b" },
      { id: 2, text: "a" },
      { id: 3, text: "d" },
      { id: 4, text: "c" },
    ],
  } as ArrayState);

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(container.textContent!.replace(/\s/g, "")).toBe("^badc$");

  state.items.sort((a, b) => a.text.localeCompare(b.text));

  expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");
});
