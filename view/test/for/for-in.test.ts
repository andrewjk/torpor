import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/ForIn.tera";

test("for in -- mounted", () => {
  const state = $watch({
    item: {
      first: "1",
      second: "2",
      third: "3",
    },
  });

  const container = document.createElement("div");
  mountComponent(container, Component, state);

  check(container);
});

test("for in -- hydrated", () => {
  const state = $watch({
    item: {
      first: "1",
      second: "2",
      third: "3",
    },
  });

  const container = document.createElement("div");
  const path = "./test/for/components/ForIn.tera";
  hydrateComponent(container, path, Component, state);

  check(container);
});

function check(container: HTMLElement) {
  expect(queryByText(container, "1")).toBeInTheDocument();
  expect(queryByText(container, "2")).toBeInTheDocument();
  expect(queryByText(container, "3")).toBeInTheDocument();
  expect(queryByText(container, "4")).toBeNull();
}
