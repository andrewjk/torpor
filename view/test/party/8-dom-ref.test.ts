import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/InputFocused.tera";

test("dom ref -- mounted", () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("dom ref -- hydrated", () => {
  const container = document.createElement("div");
  const path = "./test/party/components/InputFocused.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

async function check(container: HTMLElement) {
  const input = container.getElementsByTagName("input")[0];

  expect(input.value).toBe("hi");
}
