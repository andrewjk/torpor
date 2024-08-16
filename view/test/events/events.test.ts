import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Increment.tera";

test("events -- mounted", async () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("events -- hydrated", async () => {
  const container = document.createElement("div");
  const path = "./test/events/components/Increment.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

async function check(container: HTMLElement) {
  const user = userEvent.setup();

  expect(queryByText(container, "The count is 0.")).toBeInTheDocument();

  const increment = document.getElementById("increment")!;
  await user.click(increment);

  expect(queryByText(container, "The count is 1.")).toBeInTheDocument();

  const increment5 = document.getElementById("increment5")!;
  await user.click(increment5);

  expect(queryByText(container, "The count is 6.")).toBeInTheDocument();
}
