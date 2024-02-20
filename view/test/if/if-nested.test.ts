import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/IfNested.tera";

test("if nested", () => {
  const state = watch({ counter: 8 });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's both true!")).toBeNull();
  expect(queryByText(container, "The second is not true!")).toBeInTheDocument();
  expect(queryByText(container, "The first is not true!")).toBeNull();

  state.counter = 12;

  expect(queryByText(container, "It's both true!")).toBeInTheDocument();
  expect(queryByText(container, "The second is not true!")).toBeNull();
  expect(queryByText(container, "The first is not true!")).toBeNull();

  state.counter = 3;

  expect(queryByText(container, "It's both true!")).toBeNull();
  expect(queryByText(container, "The second is not true!")).toBeNull();
  expect(queryByText(container, "The first is not true!")).toBeInTheDocument();
});
