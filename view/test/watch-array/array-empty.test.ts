import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";
import Component from "./components/Array.tera";

test("array empty -- mounted", () => {
  const state = $watch({
    items: [],
  });

  const container = document.createElement("div");
  mountComponent(container, Component, state);

  check(container, state);
});

test("array empty -- hydrated", () => {
  const state = $watch({
    items: [],
  });

  const container = document.createElement("div");
  const path = "./test/watch-array/components/Array.tera";
  hydrateComponent(container, path, Component, state);

  check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
  expect(container.textContent!.replace(/\s/g, "")).toBe("^$");
}
