import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxList from "./components/ListBoxList.torp";

describe("ListBox", () => {
	it("Contents in a for loop", async () => {
		let $state = $watch({
			value: 1,
			items: [
				{ id: 0, text: "Content 1" },
				{ id: 1, text: "Content 2" },
				{ id: 2, text: "Content 3" },
			],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxList, $state);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 3")).toBeInTheDocument();

		$state.items.splice(1, 1);

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-selected", "false");

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(container, "Content 1"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");

		$state.items.push({ id: 3, text: "Content 4" });

		// Clicking item 4 should select item 4
		await userEvent.click(getByText(container, "Content 4"));
		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 4")).toHaveAttribute("aria-selected", "true");
	});
});
