import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import MenuBarKeyboard from "./components/MenuBarKeyboard.torp";

describe("MenuBar keyboard navigation", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("ArrowDown on a trigger opens its menu and focuses the first item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarKeyboard);

		getByText(container, "File").focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(queryByText(container, "New")).toBeInTheDocument();
		expect(getByText(container, "New")).toHaveFocus();
	});

	it("ArrowRight in an open menu moves to the next item and opens its menu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarKeyboard);

		await userEvent.click(getByText(container, "File"));
		expect(queryByText(container, "New")).toBeInTheDocument();

		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "New")).not.toBeInTheDocument();
		expect(queryByText(container, "Cut")).toBeInTheDocument();
		expect(getByText(container, "Edit")).toHaveAttribute("aria-expanded", "true");
		expect(getByText(container, "File")).toHaveAttribute("aria-expanded", "false");
		expect(getByText(container, "Cut")).toHaveFocus();
	});

	it("ArrowLeft in an open menu moves to the previous item and opens its menu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarKeyboard);

		await userEvent.click(getByText(container, "Edit"));
		expect(queryByText(container, "Cut")).toBeInTheDocument();

		await userEvent.keyboard("{ArrowLeft}");
		expect(queryByText(container, "Cut")).not.toBeInTheDocument();
		expect(queryByText(container, "New")).toBeInTheDocument();
		expect(getByText(container, "File")).toHaveAttribute("aria-expanded", "true");
		expect(getByText(container, "Edit")).toHaveAttribute("aria-expanded", "false");
		expect(getByText(container, "New")).toHaveFocus();
	});

	it("Escape closes the menu and returns focus to the trigger", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarKeyboard);

		await userEvent.click(getByText(container, "File"));
		expect(queryByText(container, "New")).toBeInTheDocument();

		await userEvent.keyboard("{Escape}");
		expect(queryByText(container, "New")).not.toBeInTheDocument();
		expect(getByText(container, "File")).toHaveFocus();
	});

	it("arrow keys on the triggers move focus without opening menus", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarKeyboard);

		getByText(container, "File").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(getByText(container, "Edit")).toHaveFocus();
		expect(queryByText(container, "Cut")).not.toBeInTheDocument();

		await userEvent.keyboard("{ArrowLeft}");
		expect(getByText(container, "File")).toHaveFocus();
		expect(queryByText(container, "New")).not.toBeInTheDocument();
	});
});
