import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TabGroupAccessibility from "./components/TabGroupAccessibility.torp";

describe("TabGroup", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TabGroupAccessibility, { value: "0" });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

		// The element that serves as the container for the set of tabs has role
		// tablist
		expect(queryByText(container, "Header 1")?.parentElement?.parentElement).toHaveAttribute(
			"role",
			"tablist",
		);

		// Each element that serves as a tab has role tab and is contained
		// within the element with role tablist
		expect(queryByText(container, "Header 1")).toHaveAttribute("role", "tab");

		// Each element that contains the content panel for a tab has role
		// tabpanel
		expect(queryByText(container, "Body 1")).toHaveAttribute("role", "tabpanel");

		// If the tab list has a visible label, the element with role tablist
		// has aria-labelledby set to a value that refers to the labelling
		// element. Otherwise, the tablist element has a label provided by
		// aria-label
		// NOTE: We only support aria-label and it's required
		expect(queryByText(container, "Header 1")?.parentElement?.parentElement).toHaveAttribute(
			"aria-label",
			"Example tabs",
		);

		// Each element with role tab has the property aria-controls referring
		// to its associated tabpanel element
		const tabId = queryByText(container, "Header 1")?.id;
		const contentId = queryByText(container, "Body 1")?.id;
		expect(queryByText(container, "Header 1")).toHaveAttribute("aria-controls", contentId);

		// The active tab element has the state aria-selected set to true and
		// all other tab elements have it set to false
		expect(queryByText(container, "Header 1")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Header 2")).toHaveAttribute("aria-selected", "false");
		expect(queryByText(container, "Header 3")).toHaveAttribute("aria-selected", "false");

		// Each element with role tabpanel has the property aria-labelledby
		// referring to its associated tab element
		expect(queryByText(container, "Body 1")).toHaveAttribute("aria-labelledby", tabId);

		// If a tab element has a popup menu, it has the property aria-haspopup
		// set to either menu or true

		// If the tablist element is vertically oriented, it has the property
		// aria-orientation set to vertical. The default value of
		// aria-orientation for a tablist element is horizontal
		expect(queryByText(container, "Header 1")?.parentElement?.parentElement).toHaveAttribute(
			"aria-orientation",
			"horizontal",
		);
	});
});
