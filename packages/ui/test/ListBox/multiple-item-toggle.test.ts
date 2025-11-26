import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxMultiple from "./components/ListBoxMultiple.torp";

describe("ListBox", () => {
	it("Multiple item toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxMultiple);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 3")).toBeInTheDocument();

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(container, "Content 1"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");

		// Clicking item 2 should select item 1 and item 2
		await userEvent.click(getByText(container, "Content 2"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");

		// Clicking item 2 again should hide item 2
		await userEvent.click(getByText(container, "Content 2"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "false");
	});
});
