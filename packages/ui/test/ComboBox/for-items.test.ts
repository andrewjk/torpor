import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { assert, describe, expect, it } from "vite-plus/test";
import ComboBoxList from "./components/ComboBoxList.torp";

// TODO: Support number ids
// TODO: Put the id in a hidden input??

describe("ComboBox", () => {
	it("Items in a for loop", async () => {
		let $state = $watch({
			value: "1",
			items: [
				{ id: "0", text: "Item 1" },
				{ id: "1", text: "Item 2" },
				{ id: "2", text: "Item 3" },
			],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxList, $state);

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Item 3")).toBeInTheDocument();

		$state.items.splice(1, 1);

		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Item 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 3")).toHaveAttribute("aria-selected", "false");

		// Clicking item 1 should select item 1
		await userEvent.click(getByText(container, "Item 1"));

		await userEvent.click(button);
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");
		expect(input.value).toBe("0");

		$state.items.push({ id: "3", text: "Item 4" });

		// Clicking item 4 should select item 4
		await userEvent.click(getByText(container, "Item 4"));

		await userEvent.click(button);
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Item 4")).toHaveAttribute("aria-selected", "true");
		expect(input.value).toBe("3");
	});

	it("Item removal while open", async () => {
		let $state = $watch({
			value: 1,
			items: [
				{ id: 0, text: "Item 1" },
				{ id: 1, text: "Item 2" },
				{ id: 2, text: "Item 3" },
			],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxList, $state);

		const button = container.getElementsByTagName("button")[0];
		const input = container.getElementsByTagName("input")[0];
		assert(button, "button not found");
		assert(input, "input not found");

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Item 3")).toBeInTheDocument();

		$state.items.splice(1, 1);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 3")).toBeInTheDocument();

		await userEvent.click(getByText(container, "Item 3"));

		expect(input.value).toBe("2");
	});

	it("Item reordering", async () => {
		let $state = $watch({
			value: "0",
			items: [
				{ id: "0", text: "Item 1" },
				{ id: "1", text: "Item 2" },
				{ id: "2", text: "Item 3" },
			],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxList, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");

		$state.items.reverse();

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "true");
	});
});
