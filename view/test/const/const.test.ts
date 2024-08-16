import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Const.tera";

test("const -- mounted", () => {
  const container = document.createElement("div");
  mountComponent(container, Component);

  check(container);
});

test("const -- hydrated", () => {
  const container = document.createElement("div");
  const path = "./test/const/components/Const.tera";
  hydrateComponent(container, path, Component);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "Hello, Boris!")).toBeInTheDocument();
}
