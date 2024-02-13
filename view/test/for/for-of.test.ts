import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/ForOf.tera";

test("for of", () => {
  const state = watch({
    items: ["1", "2", "3", "4", "5"],
  });

  const container = document.createElement("container");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "1")).toBeInTheDocument();
  expect(queryByText(container, "2")).toBeInTheDocument();
  expect(queryByText(container, "3")).toBeInTheDocument();
  expect(queryByText(container, "4")).toBeInTheDocument();
  expect(queryByText(container, "5")).toBeInTheDocument();
  expect(queryByText(container, "6")).toBeNull();
});
