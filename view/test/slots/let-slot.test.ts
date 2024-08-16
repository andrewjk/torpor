import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Let.tera";

test("let slot -- mounted", () => {
  const state = $watch({
    items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
  });

  const container = document.createElement("div");
  mountComponent(container, Component, state);

  check(container);
});

test("let slot -- hydrated", () => {
  const state = $watch({
    items: [{ text: "item 1" }, { text: "item 2" }, { text: "item 3" }],
  });

  const container = document.createElement("div");
  const path = "./test/slots/components/Let.tera";
  hydrateComponent(container, path, Component, state);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "item 1")).toBeInTheDocument();
  expect(queryByText(container, "item 2")).toBeInTheDocument();
  expect(queryByText(container, "item 3")).toBeInTheDocument();
}
