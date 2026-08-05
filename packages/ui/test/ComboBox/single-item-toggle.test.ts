import { getByText, queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vite-plus/test";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("Single item toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, {});

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);
		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Item 3")).toBeInTheDocument();

		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Item 3")).toHaveAttribute("aria-selected", "false");

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(container, "Item 1"));
		expect(input.value).toBe("Item 1");

		await userEvent.click(input); // show
		expect(queryAllByText(container, "Item 1").at(-1)).toHaveAttribute("aria-selected", "true");

		// Clicking item 2 should unselect item 1 and select item 2
		await userEvent.click(getByText(container, "Item 2"));
		expect(input.value).toBe("Item 2");

		await userEvent.click(input); // show
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
		expect(queryAllByText(container, "Item 2").at(-1)).toHaveAttribute("aria-selected", "true");
	});
});
