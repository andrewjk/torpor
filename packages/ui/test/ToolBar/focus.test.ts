import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarFocus from "./components/ToolBarFocus.torp";

describe("ToolBar", () => {
	it("Focusing toolbar container focuses first item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarFocus);

		const toolbar = container.querySelector('[role="toolbar"]') as HTMLElement;
		toolbar.focus();

		const button1 = getByText(container, "Button 1");
		expect(document.activeElement).toBe(button1);
	});

	it("Item can be focused programmatically", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarFocus);

		const button2 = getByText(container, "Button 2");
		button2.focus();

		expect(document.activeElement).toBe(button2);
	});

	it("Popout trigger focuses first item in menu on open", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarFocus);

		const popoutTrigger = getByText(container, "Popout");
		await userEvent.click(popoutTrigger);

		const item1 = getByText(container, "Item 1");
		expect(document.activeElement).toBe(item1);
	});

	it("Closing popout returns focus to trigger", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarFocus);

		const popoutTrigger = getByText(container, "Popout");
		await userEvent.click(popoutTrigger);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();

		fireEvent(popoutTrigger, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

		expect(queryByText(container, "Item 1")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(popoutTrigger);
	});
});
