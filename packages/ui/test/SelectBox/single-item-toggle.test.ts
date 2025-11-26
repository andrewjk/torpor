import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import SelectBoxSingle from "./components/SelectBoxSingle.torp";

describe("SelectBox", () => {
	it("Single item toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxSingle, {});

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
		// TODO: expect(input.value).toBe("1");

		await userEvent.click(input);
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");

		// Clicking item 2 should unselect item 1 and select item 2
		await userEvent.click(getByText(container, "Item 2"));
		// TODO: expect(input.value).toBe("1");

		await userEvent.click(input);
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "true");
	});
});
