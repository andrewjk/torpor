import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import SelectBoxMultiple from "./components/SelectBoxMultiple.torp";

describe("SelectBox", () => {
	it("Multiple item toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxMultiple, { value: [] });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Item 3")).toBeInTheDocument();

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(container, "Item 1"));
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(button.textContent.trim()).toBe("Item 1");

		// Clicking item 2 should select item 1 and item 2
		await userEvent.click(getByText(container, "Item 2"));
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "true");
		// TODO: expect(button.textContent.trim()).toBe("Item 1, Item2");

		// Clicking item 2 again should select item 2
		await userEvent.click(getByText(container, "Item 2"));
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "false");
		// TODO: expect(button.textContent.trim()).toBe("Item 1");
	});
});
