import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxSingle from "./components/ListBoxSingle.torp";

describe("ListBox", () => {
	it("Single item toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxSingle);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 3")).toBeInTheDocument();

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-selected", "false");

		// Clicking item 1 should select body 1
		await userEvent.click(getByText(container, "Content 1"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");

		// Clicking item 2 should unselect body 1 and select body 2
		await userEvent.click(getByText(container, "Content 2"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");
	});
});
