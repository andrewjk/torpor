import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxDisabled from "./components/ListBoxDisabled.torp";

describe("ListBox", () => {
	it("ListBox has aria-disabled when disabled prop is true", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxDisabled, { disabled: true });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toHaveAttribute("aria-disabled", "true");
	});

	it("Items have aria-disabled when ListBox is disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxDisabled, { disabled: true });

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-disabled", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-disabled", "true");
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-disabled", "true");
	});

	it("Items have aria-disabled when item itself is disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxDisabled, { disabled: false });

		expect(queryByText(container, "Content 1")).not.toHaveAttribute("aria-disabled");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-disabled", "true");
		expect(queryByText(container, "Content 3")).not.toHaveAttribute("aria-disabled");
	});

	it("Items have aria-disabled when either ListBox or item is disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxDisabled, { disabled: true });

		expect(queryByText(container, "Content 1")).toHaveAttribute("aria-disabled", "true");
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-disabled", "true");
		expect(queryByText(container, "Content 3")).toHaveAttribute("aria-disabled", "true");
	});
});
