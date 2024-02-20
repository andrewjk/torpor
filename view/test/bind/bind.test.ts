import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import Component from "./components/BindText.tera";

test("bind text value", async () => {
  const user = userEvent.setup();

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component);

  const input = document.getElementsByTagName("input")[0];
  const para = document.getElementsByTagName("p")[0];

  expect(input).toHaveValue("Alice");
  expect(para).toHaveTextContent("Hello, Alice");

  // Update the input value
  await user.clear(input);
  await user.type(input, "Bob");

  expect(input).toHaveValue("Bob");
  expect(para).toHaveTextContent("Hello, Bob");
});
