import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import context from "../../src/global/context";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
import printContext from "../../src/watch/internal/printContext";
import Component from "./components/Object.tera";

test("watch object", async () => {
  const state = $watch({
    text: "top",
    child: {
      childText: "child",
      item: {
        itemText: "item",
      },
    },
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(container, Component, state);

  expect(container.textContent!.replace(/\s/g, "")).toBe("topchilditem");

  state.child.item = {
    itemText: "changed",
  };

  expect(container.textContent!.replace(/\s/g, "")).toBe("topchildchanged");

  state.child = {
    childText: "new child",
    item: {
      itemText: "new item",
    },
  };

  expect(container.textContent!.replace(/\s/g, "")).toBe("topnewchildnewitem");
  //printContext();
  // Make sure that effects have been transferred across
  state.child.item.itemText = "even newer item";

  expect(container.textContent!.replace(/\s/g, "")).toBe("topnewchildevenneweritem");
});
