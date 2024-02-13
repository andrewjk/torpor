import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/IfAfterIf.tera";

test("if after if", () => {
  const state = watch({ counter: 8 });

  const container = document.createElement("container");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's true!")).toBeNull();
  expect(queryByText(container, "It's also true!")).toBeInTheDocument();

  state.counter = 12;

  expect(queryByText(container, "It's true!")).toBeInTheDocument();
  expect(queryByText(container, "It's also true!")).toBeInTheDocument();

  state.counter = 3;

  expect(queryByText(container, "It's true!")).toBeNull();
  expect(queryByText(container, "It's also true!")).toBeNull();
});
