import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import watch from "../../src/watch/watch";
import Component from "./components/Switch.tera";

test("switch values", () => {
  const state = watch({ value: 1 });

  const container = document.createElement("container");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(queryByText(container, "A small value.")).toBeInTheDocument();
  expect(queryByText(container, "A large value.")).toBeNull();
  expect(queryByText(container, "Another value.")).toBeNull();

  state.value = 100;

  expect(queryByText(container, "A small value.")).toBeNull();
  expect(queryByText(container, "A large value.")).toBeInTheDocument();
  expect(queryByText(container, "Another value.")).toBeNull();

  state.value = 500;

  expect(queryByText(container, "A small value.")).toBeNull();
  expect(queryByText(container, "A large value.")).toBeNull();
  expect(queryByText(container, "Another value.")).toBeInTheDocument();
});
