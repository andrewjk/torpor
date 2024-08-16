import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { bench, expect } from "vitest";
import mountComponent from "../mountComponent";
import Bench from "./components/Bench.tera";

const user = userEvent.setup();

const div = document.createElement("div");
document.body.appendChild(div);
render(div, Bench);

bench("bench", async () => {
  const createButton = document.getElementById("create")!;
  const createLotsButton = document.getElementById("createlots")!;
  const appendButton = document.getElementById("append")!;
  const updateButton = document.getElementById("update")!;
  const swapButton = document.getElementById("swaprows")!;
  const clearButton = document.getElementById("clear")!;

  try {
    // Press a bunch of buttons
    await user.click(createButton);
    await user.click(appendButton);
    await user.click(updateButton);
    await user.click(swapButton);
    await user.click(clearButton);
  } catch {
    console.log("ERROR");
  }
});

const ev = new MouseEvent("click");
function click(button: HTMLElement) {
  fireEvent(button, ev);
}
