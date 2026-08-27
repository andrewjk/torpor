import { fireEvent, getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import FocusGroupTest from "./components/FocusGroupTest.torp";

describe("FocusGroup", () => {
	it("the first button is the initial tab stop", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, {});

		const buttons = [
			getByText(container, "First"),
			getByText(container, "Second"),
			getByText(container, "Third"),
		];
		expect(buttons[0]).toHaveAttribute("tabindex", "0");
		expect(buttons[1]).toHaveAttribute("tabindex", "-1");
		expect(buttons[2]).toHaveAttribute("tabindex", "-1");
	});

	it("arrow keys move focus within the group", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, {});

		const first = getByText(container, "First");
		const second = getByText(container, "Second");
		first.focus();

		fireEvent(first, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
		expect(document.activeElement).toBe(second);

		fireEvent(second, new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
		expect(document.activeElement).toBe(first);
	});

	it("skips disabled items when moving", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, { disabledSecond: true });

		const first = getByText(container, "First");
		const third = getByText(container, "Third");
		first.focus();

		fireEvent(first, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
		expect(document.activeElement).toBe(third);
	});

	it("Home and End jump to the ends", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, {});

		const first = getByText(container, "First");
		const third = getByText(container, "Third");
		third.focus();

		fireEvent(third, new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
		expect(document.activeElement).toBe(first);

		fireEvent(first, new KeyboardEvent("keydown", { key: "End", bubbles: true }));
		expect(document.activeElement).toBe(third);
	});

	it("vertical orientation swaps the arrows", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, { orientation: "vertical" });

		const first = getByText(container, "First");
		const second = getByText(container, "Second");
		first.focus();

		// Horizontal arrows do nothing in a vertical group
		fireEvent(first, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
		expect(document.activeElement).toBe(first);

		fireEvent(first, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(second);
	});

	it("clicking still works and buttons keep their own handlers", async () => {
		const onsecond = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FocusGroupTest as any, { onsecond });

		fireEvent.click(getByText(container, "Second"));
		expect(onsecond).toHaveBeenCalledTimes(1);
	});
});
