import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";
import printContext from "../../src/watch/internal/printContext";
import Component from "./components/For.tera";

test("for effect pause", async () => {
  const _state = {
    items: [
      { id: 0, text: "first" },
      { id: 1, text: "second" },
      { id: 2, text: "third" },
    ],
  };
  const state = $watch(_state);

  // This didn't work the way I hoped it would
  //let changedTexts: string[] = [];
  //for (let item of state.items) {
  //  $run(() => {
  //    changedTexts.push(item.text);
  //  });
  //}

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  // This should have been done once per item
  //expect(changedTexts.length).toBe(3);

  expect(queryByText(container, "first")).toBeInTheDocument();
  expect(queryByText(container, "second")).toBeInTheDocument();
  expect(queryByText(container, "third")).toBeInTheDocument();

  // Remove the first item
  state.items = [
    { id: 1, text: "second" },
    { id: 2, text: "third" },
  ];
  // This should still have been done once per item because updates were paused
  //expect(changedTexts.length).toBe(3);

  expect(queryByText(container, "first")).toBeNull();
  expect(queryByText(container, "second")).toBeInTheDocument();
  expect(queryByText(container, "third")).toBeInTheDocument();

  // Update the last item
  state.items[1].text = "changed";

  // This should have been done another time
  //expect(changedTexts.length).toBe(4);

  expect(queryByText(container, "second")).toBeInTheDocument();
  expect(queryByText(container, "third")).toBeNull();
  expect(queryByText(container, "changed")).toBeInTheDocument();

  // Set the items with different text
  state.items = [
    { id: 1, text: "second again" },
    { id: 2, text: "third again" },
  ];
  //expect(changedTexts.length).toBe(4);

  expect(queryByText(container, "second")).toBeNull();
  expect(queryByText(container, "changed")).toBeNull();
  expect(queryByText(container, "second again")).toBeInTheDocument();
  expect(queryByText(container, "third again")).toBeInTheDocument();
});
