import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import Component from "./components/IfElse.tera";

test("if true", () => {
  const state = $watch({ counter: 10 });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's true!")).toBeInTheDocument();
  expect(queryByText(container, "It's not true...")).toBeNull();

  state.counter = 5;

  expect(queryByText(container, "It's true!")).toBeNull();
  expect(queryByText(container, "It's not true...")).toBeInTheDocument();

  state.counter = 15;

  expect(queryByText(container, "It's true!")).toBeInTheDocument();
  expect(queryByText(container, "It's not true...")).toBeNull();
});
