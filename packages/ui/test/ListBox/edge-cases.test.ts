import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxMultiple from "./components/ListBoxMultiple.torp";
import ListBoxSingle from "./components/ListBoxSingle.torp";

describe("ListBox", () => {
	it("Empty ListBox renders without errors", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxSingle);

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toBeInTheDocument();
	});

	it("All items disabled ListBox renders without errors", async () => {
		const $state = $watch({
			value: [1],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxMultiple, $state);

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toBeInTheDocument();
	});

	it("Value prop updates selection in single-select", async () => {
		let $state = $watch({
			value: 0,
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxSingle, $state);

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "false");

		$state.value = 1;

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");
	});

	it("Value prop updates selection in multi-select", async () => {
		let $state = $watch({
			value: [0],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxMultiple, $state);

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-selected", "false");

		$state.value = [1, 2];

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-selected", "true");
	});

	it("Deselecting single-select by clicking again", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxSingle, { value: 0 });

		const item1 = queryByText(container, "Content 1");
		expect(item1).toHaveAttribute("aria-selected", "true");

		item1?.click();

		expect(item1).toHaveAttribute("aria-selected", "false");
	});
});
