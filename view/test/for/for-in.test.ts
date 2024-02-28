import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import Component from "./components/ForIn.tera";

test("for in", () => {
  const state = $watch({
    item: {
      first: "1",
      second: "2",
      third: "3",
    },
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "1")).toBeInTheDocument();
  expect(queryByText(container, "2")).toBeInTheDocument();
  expect(queryByText(container, "3")).toBeInTheDocument();
  expect(queryByText(container, "4")).toBeNull();
});
