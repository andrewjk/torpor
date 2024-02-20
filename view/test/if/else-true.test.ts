import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/IfElseIf.tera";

test("else if true", () => {
  const state = watch({ counter: 3 });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "It's not there yet")).toBeInTheDocument();
  expect(queryByText(container, "It's over five!")).toBeNull();
  expect(queryByText(container, "It's over ten!")).toBeNull();

  state.counter = 8;

  expect(queryByText(container, "It's not there yet")).toBeNull();
  expect(queryByText(container, "It's over five!")).toBeInTheDocument();
  expect(queryByText(container, "It's over ten!")).toBeNull();

  state.counter = 12;

  expect(queryByText(container, "It's not there yet")).toBeNull();
  expect(queryByText(container, "It's over five!")).toBeNull();
  expect(queryByText(container, "It's over ten!")).toBeInTheDocument();
});
