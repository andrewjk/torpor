import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import Component from "./components/For.tera";

test("for", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component);

  expect(queryByText(container, "0")).toBeInTheDocument();
  expect(queryByText(container, "1")).toBeInTheDocument();
  expect(queryByText(container, "2")).toBeInTheDocument();
  expect(queryByText(container, "3")).toBeInTheDocument();
  expect(queryByText(container, "4")).toBeInTheDocument();
  expect(queryByText(container, "5")).toBeNull();
});
