import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/BindText.tera";

test("bind text value -- mounted", async () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  await check();
});

test("bind text value -- hydrated", async () => {
  const container = document.createElement("div");
  const path = "./test/bind/components/BindText.tera";
  hydrateComponent(container, path, Component);

  await check();
});

async function check() {
  const user = userEvent.setup();

  const input = document.getElementsByTagName("input")[0];
  const para = document.getElementsByTagName("p")[0];

  expect(input).toHaveValue("Alice");
  expect(para).toHaveTextContent("Hello, Alice");

  // Update the input value
  await user.clear(input);
  await user.type(input, "Bob");

  expect(input).toHaveValue("Bob");
  expect(para).toHaveTextContent("Hello, Bob");
}
