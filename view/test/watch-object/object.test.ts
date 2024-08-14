import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import render from "../../src/render/render";
import $watch from "../../src/watch/$watch";
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

  expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child item");

  state.child.item = {
    itemText: "changed",
  };

  expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child changed");

  state.child = {
    childText: "new_child",
    item: {
      itemText: "new_item",
    },
  };

  expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child new_item");
  //printContext();
  // Make sure that effects have been transferred across
  state.child.item.itemText = "even_newer_item";

  expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child even_newer_item");
});
