import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import Component from "./components/Basic.tera";

test("basic slot", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component);

  expect(queryByText(container, "Basic stuff")).toBeInTheDocument();
  expect(queryByText(container, "Default header...")).toBeNull();
});
