import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MenuKeyboard from "./components/MenuKeyboard.torp";

describe("Menu keyboard navigation", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("ArrowDown moves focus to next item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		getByText(container, "Item 1").focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(getByText(container, "Item 2")).toHaveFocus();
	});

	it("ArrowUp moves focus to previous item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		getByText(container, "Item 2").focus();
		await userEvent.keyboard("{ArrowUp}");
		expect(getByText(container, "Item 1")).toHaveFocus();
	});

	it("Home moves to first item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		getByText(container, "Item 3").focus();
		await userEvent.keyboard("{Home}");
		expect(getByText(container, "Item 1")).toHaveFocus();
	});

	it("End moves to last item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		getByText(container, "Item 1").focus();
		await userEvent.keyboard("{End}");
		expect(getByText(container, "Item 3")).toHaveFocus();
	});

	it("Escape closes the menu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Submenu item 1")).toBeInTheDocument();
		await userEvent.keyboard("{Escape}");
		expect(queryByText(container, "Submenu item 1")).not.toBeInTheDocument();
	});

	it("ArrowRight opens submenu from trigger", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		await userEvent.click(getByText(container, "Popout trigger"));
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "Submenu item 1")).toBeInTheDocument();
	});

	it("ArrowLeft closes submenu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		await userEvent.click(getByText(container, "Popout trigger"));
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "Submenu item 1")).toBeInTheDocument();
		await userEvent.keyboard("{ArrowLeft}");
		expect(queryByText(container, "Submenu item 1")).not.toBeInTheDocument();
	});

	it("Tab moves focus out of menu and closes it", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuKeyboard);

		await userEvent.click(getByText(container, "Popout trigger"));
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "Submenu item 1")).toBeInTheDocument();
		await userEvent.keyboard("{Tab}");
		expect(queryByText(container, "Submenu item 1")).not.toBeInTheDocument();
	});

	it.skip("Space selects focused item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const callback = vi.fn();
		mount(container, MenuKeyboard, { callback });

		getByText(container, "Item 1").focus();
		await userEvent.keyboard("{Space}");
		expect(callback).toHaveBeenCalledWith("item1");
	});

	it.skip("Enter selects focused item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const callback = vi.fn();
		mount(container, MenuKeyboard, { callback });

		getByText(container, "Item 1").focus();
		await userEvent.keyboard("{Enter}");
		expect(callback).toHaveBeenCalledWith("item1");
	});
});
