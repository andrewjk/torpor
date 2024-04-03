import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array splice delete and add", () => {
  const state = $watch({
    items: [
      { id: 1, text: "a" },
      { id: 2, text: "b" },
      { id: 3, text: "c" },
      { id: 4, text: "d" },
    ],
  } as ArrayState);

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

  state.items.splice(1, 1, { id: 5, text: "e" }, { id: 6, text: "f" });

  expect(container.textContent!.replace(/\s/g, "")).toBe("^aefcd$");
});
