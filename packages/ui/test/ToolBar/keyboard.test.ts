import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarKeyboard from "./components/ToolBarKeyboard.torp";
import ToolBarVertical from "./components/ToolBarVertical.torp";

describe("ToolBar", () => {
	describe("Horizontal toolbar", () => {
		it("Arrow Right moves focus forward", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const button1 = getByText(container, "Button 1");
			const button2 = getByText(container, "Button 2");

			button1.focus();
			expect(document.activeElement).toBe(button1);

			fireEvent(button1, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
			expect(document.activeElement).toBe(button2);
		});

		it("Arrow Left moves focus backward", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const button2 = getByText(container, "Button 2");
			const button1 = getByText(container, "Button 1");

			button2.focus();
			expect(document.activeElement).toBe(button2);

			fireEvent(button2, new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
			expect(document.activeElement).toBe(button1);
		});

		it("Arrow Down opens popout", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const popoutTrigger = getByText(container, "Popout 1");

			popoutTrigger.focus();
			expect(document.activeElement).toBe(popoutTrigger);
			expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();

			fireEvent(popoutTrigger, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
			expect(queryByText(container, "Item 1.1")).toBeInTheDocument();
		});

		it("Escape closes popout and keeps focus on trigger", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const popoutTrigger = getByText(container, "Popout 1");

			await userEvent.click(popoutTrigger);
			expect(queryByText(container, "Item 1.1")).toBeInTheDocument();

			fireEvent(popoutTrigger, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
			expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();
			expect(document.activeElement).toBe(popoutTrigger);
		});

		it("Home jumps to first item", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const button3 = getByText(container, "Button 3");
			const button1 = getByText(container, "Button 1");

			button3.focus();
			expect(document.activeElement).toBe(button3);

			fireEvent(button3, new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
			expect(document.activeElement).toBe(button1);
		});

		it("End jumps to last item", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const button1 = getByText(container, "Button 1");
			const button4 = getByText(container, "Button 4");

			button1.focus();
			expect(document.activeElement).toBe(button1);

			fireEvent(button1, new KeyboardEvent("keydown", { key: "End", bubbles: true }));
			expect(document.activeElement).toBe(button4);
		});

		it("Arrow keys at boundaries don't move focus", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarKeyboard);

			const button1 = getByText(container, "Button 1");
			const button4 = getByText(container, "Button 4");

			button1.focus();
			fireEvent(button1, new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
			expect(document.activeElement).toBe(button1);

			button4.focus();
			fireEvent(button4, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
			expect(document.activeElement).toBe(button4);
		});
	});

	describe("Vertical toolbar", () => {
		it("Arrow Down moves focus forward", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const button1 = getByText(container, "Button 1");
			const button2 = getByText(container, "Button 2");

			button1.focus();
			expect(document.activeElement).toBe(button1);

			fireEvent(button1, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
			expect(document.activeElement).toBe(button2);
		});

		it("Arrow Up moves focus backward", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const button2 = getByText(container, "Button 2");
			const button1 = getByText(container, "Button 1");

			button2.focus();
			expect(document.activeElement).toBe(button2);

			fireEvent(button2, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
			expect(document.activeElement).toBe(button1);
		});

		it("Arrow Right opens popout", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const popoutTrigger = getByText(container, "Popout");

			popoutTrigger.focus();
			expect(document.activeElement).toBe(popoutTrigger);
			expect(queryByText(container, "Item 1")).not.toBeInTheDocument();

			fireEvent(popoutTrigger, new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
			expect(queryByText(container, "Item 1")).toBeInTheDocument();
		});

		it("Home jumps to first item", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const button3 = getByText(container, "Button 3");
			const button1 = getByText(container, "Button 1");

			button3.focus();
			expect(document.activeElement).toBe(button3);

			fireEvent(button3, new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
			expect(document.activeElement).toBe(button1);
		});

		it("End jumps to last item", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const button1 = getByText(container, "Button 1");
			const button3 = getByText(container, "Button 3");

			button1.focus();
			expect(document.activeElement).toBe(button1);

			fireEvent(button1, new KeyboardEvent("keydown", { key: "End", bubbles: true }));
			expect(document.activeElement).toBe(button3);
		});

		it("Arrow keys at boundaries don't move focus", async () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ToolBarVertical);

			const button1 = getByText(container, "Button 1");
			const button3 = getByText(container, "Button 3");

			button1.focus();
			fireEvent(button1, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
			expect(document.activeElement).toBe(button1);

			button3.focus();
			fireEvent(button3, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
			expect(document.activeElement).toBe(button3);
		});
	});
});
