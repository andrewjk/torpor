import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { afterAll, describe, expect, test, vi } from "vitest";
import render from "../../src/render/render";
import Component from "./components/Console.tera";

describe("console", () => {
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

  afterAll(() => {
    consoleMock.mockReset();
  });

  test("console", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(container, Component);

    //expect(consoleMock).toHaveBeenCalledOnce();
    expect(consoleMock).toHaveBeenCalledWith("@console is logging here");
  });
});
