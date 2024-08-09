import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import Component from "./components/Function.tera";

test("function", async () => {
  const user = userEvent.setup();

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component);

  expect(queryByText(container, "The count is 0.")).toBeInTheDocument();

  const increment = document.getElementById("increment")!;
  await user.click(increment);

  expect(queryByText(container, "The count is 1.")).toBeInTheDocument();
});
