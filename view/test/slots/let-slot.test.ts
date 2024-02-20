import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/Let.tera";

test("let slot", () => {
  const state = watch({
    items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "item 1")).toBeInTheDocument();
  expect(queryByText(container, "item 2")).toBeInTheDocument();
  expect(queryByText(container, "item 3")).toBeInTheDocument();
});
