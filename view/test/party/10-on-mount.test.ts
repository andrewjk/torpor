import { queryByAttribute, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/PageTitle.tera";

test("on mount -- mounted", () => {
  document.title = "Document Title";

  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("on mount -- hydrated", () => {
  const container = document.createElement("div");
  const path = "./test/party/components/PageTitle.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "Page title: Document Title")).toBeInTheDocument();
}
