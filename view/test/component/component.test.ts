import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Component.tera";

test("component with props -- mounted", () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("component with props -- hydrated", () => {
  const container = document.createElement("div");
  const path = "./test/component/components/Component.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "Hi, Amy")).toBeInTheDocument();
}
