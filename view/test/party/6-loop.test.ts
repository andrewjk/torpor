import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Colors.tera";

test("loop -- mounted", () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("loop -- hydrated", () => {
  const container = document.createElement("div");
  const path = "./test/party/components/Colors.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "red")).toBeInTheDocument();
  expect(queryByText(container, "green")).toBeInTheDocument();
  expect(queryByText(container, "blue")).toBeInTheDocument();
}
