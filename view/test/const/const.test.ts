import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import Component from "./components/Const.tera";

test("const", () => {
  const container = document.createElement("container");
  document.body.appendChild(container);
  render(container, Component);

  expect(queryByText(container, "Hello, Boris!")).toBeInTheDocument();
});
