import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Function.tera";

test("function -- mounted", async () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("function -- hydrated", async () => {
  const container = document.createElement("div");
  const path = "./test/function/components/Function.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

async function check(container: HTMLElement) {
  const user = userEvent.setup();

  expect(queryByText(container, "The count is 0.")).toBeInTheDocument();

  const increment = Array.from(container.children).find((e) => e.id === "increment");
  expect(increment).not.toBeNull();
  await user.click(increment!);

  expect(queryByText(container, "The count is 1.")).toBeInTheDocument();
}
