import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/IfElseIf.tera";

interface State {
  counter: number;
}

test("else if true -- mounted", () => {
  const state = $watch({ counter: 8 });

  const container = document.createElement("div");
  mountComponent(container, Component, state);

  check(container, state);
});

test("else if true -- hydrated", () => {
  const state = $watch({ counter: 8 });

  const container = document.createElement("div");
  const path = "./test/if/components/IfElseIf.tera";
  hydrateComponent(container, path, Component, state);

  check(container, state);
});

function check(container: HTMLElement, state: State) {
  expect(queryByText(container, "It's not there yet")).toBeNull();
  expect(queryByText(container, "It's over five!")).toBeInTheDocument();
  expect(queryByText(container, "It's over ten!")).toBeNull();

  state.counter = 3;

  expect(queryByText(container, "It's not there yet")).toBeInTheDocument();
  expect(queryByText(container, "It's over five!")).toBeNull();
  expect(queryByText(container, "It's over ten!")).toBeNull();

  state.counter = 12;

  expect(queryByText(container, "It's not there yet")).toBeNull();
  expect(queryByText(container, "It's over five!")).toBeNull();
  expect(queryByText(container, "It's over ten!")).toBeInTheDocument();
}
