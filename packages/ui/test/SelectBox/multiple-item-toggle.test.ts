import { getByText, getAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { assert, describe, expect, it } from "vite-plus/test";
import SelectBoxMultiple from "./components/SelectBoxMultiple.torp";

describe("SelectBox", () => {
	it("Multiple item toggle", async () => {
		let $state = $watch({ value: [] as any[] });
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxMultiple, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		const listbox = container.querySelector('[role="listbox"]')!;
		expect(queryByText(listbox, "Item 1")).toBeInTheDocument();
		expect(queryByText(listbox, "Item 2")).toBeInTheDocument();
		expect(queryByText(listbox, "Item 3")).toBeInTheDocument();

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(listbox, "Item 1"));
		expect(queryByText(listbox, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(button.textContent.trim()).toBe(["Item 1"].join(", "));

		// Clicking item 2 should select item 1 and item 2
		await userEvent.click(getByText(listbox, "Item 2"));
		expect(queryByText(listbox, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(listbox, "Item 2")).toHaveAttribute("aria-selected", "true");
		expect(button.textContent.trim()).toBe(["Item 1", "Item 2"].join(", "));

		// Clicking item 2 again should deselect item 2
		await userEvent.click(getByText(listbox, "Item 2"));
		expect(queryByText(listbox, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(listbox, "Item 2")).toHaveAttribute("aria-selected", "false");
		expect(button.textContent.trim()).toBe(["Item 1"].join(", "));
	});
});
