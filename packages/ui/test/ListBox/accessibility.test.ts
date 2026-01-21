import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxAccessibility from "./components/ListBoxAccessibility.torp";
import ListBoxNewFeatures from "./components/ListBoxNewFeatures.torp";

describe("ListBox", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxAccessibility, { value: [1, 3] });

		// TODO: Tests from https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

		// An element that contains or owns all the listbox options has role listbox
		expect(queryByText(container, "Role Content")?.parentElement).toHaveAttribute(
			"role",
			"listbox",
		);

		// Each option in the listbox has role option and is contained in or
		// owned by either:
		// - The element with role listbox
		// - An element with role group that is contained in or owned by the
		//   element with role listbox
		expect(queryByText(container, "Role Content")).toHaveAttribute("role", "option");

		// TODO: Groups...

		// If the element with role listbox is not part of another widget, such
		// as a combobox, then it has either a visible label referenced by
		// aria-labelledby or a value specified for aria-label
		expect(queryByText(container, "Role Content")?.parentElement).toHaveAttribute(
			"aria-label",
			"The accessible listbox",
		);

		// If the listbox supports selection of more than one option, the
		// element with role listbox has aria-multiselectable set to true.
		// Otherwise, aria-multiselectable is either set to false or the default
		// value of false is implied
		expect(queryByText(container, "Role Content")?.parentElement).toHaveAttribute(
			"aria-multiselectable",
			"true",
		);

		// If any options are selected, each selected option has either
		// aria-selected or aria-checked set to true
		expect(queryByText(container, "Selected Content")).toHaveAttribute("aria-selected", "true");

		// All options that are selectable but not selected have either
		// aria-selected or aria-checked set to false
		expect(queryByText(container, "Unselected Content")).toHaveAttribute("aria-selected", "false");

		expect(queryByText(container, "Disabled Content")).toHaveAttribute("aria-disabled", "true");
	});

	it("aria-labelledby is set when provided", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "multiple", ariaLabelledBy: "label-id" });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toHaveAttribute("aria-labelledby", "label-id");
	});

	it("aria-disabled is set on ListBox when disabled prop is true", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "multiple", disabled: true });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toHaveAttribute("aria-disabled", "true");
	});

	it("aria-disabled is not set on ListBox when disabled prop is false", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "multiple", disabled: false });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).not.toHaveAttribute("aria-disabled");
	});

	it("aria-orientation is set to horizontal when provided", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "multiple", orientation: "horizontal" });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toHaveAttribute("aria-orientation", "horizontal");
	});

	it("aria-multiselectable is false for single-select ListBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "single" });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).not.toHaveAttribute("aria-multiselectable");
	});

	it("aria-multiselectable is true for multi-select ListBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxNewFeatures, { type: "multiple" });

		const listbox = container.querySelector('[role="listbox"]');
		expect(listbox).toHaveAttribute("aria-multiselectable", "true");
	});
});
