import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array reassign and update", () => {
  const state = watch({
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

  state.items = [
    { id: 5, text: "e" },
    { id: 6, text: "f" },
    { id: 7, text: "g" },
    { id: 8, text: "h" },
  ];

  expect(container.textContent!.replace(/\s/g, "")).toBe("^efgh$");

  state.items.push({ id: 9, text: "i" });

  expect(container.textContent!.replace(/\s/g, "")).toBe("^efghi$");
});
