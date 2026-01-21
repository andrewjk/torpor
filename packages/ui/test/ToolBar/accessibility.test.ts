import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarAccessibility from "./components/ToolBarAccessibility.torp";
import ToolBarVertical from "./components/ToolBarVertical.torp";

describe("ToolBar", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarAccessibility);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

		// A toolbar is a container for grouping a set of controls
		expect(queryByText(container, "Home")?.parentElement).toHaveAttribute("role", "toolbar");

		// If a toolbar has a visible label, element with role toolbar has aria-labelledby set to
		// a value that refers to the labelling element. Otherwise, the toolbar element has a label
		// provided by aria-label
		expect(queryByText(container, "Home")?.parentElement).toHaveAttribute(
			"aria-label",
			"Site navigation",
		);

		// When a menu item is disabled, aria-disabled is set to true
		expect(queryByText(container, "Page")).not.toHaveAttribute("aria-disabled");
		expect(queryByText(container, "Disabled")).toHaveAttribute("aria-disabled", "true");

		// Items in a toolbar may be divided by placing an element with a role of separator
		// between groups
		expect(queryByText(container, "/")).toHaveAttribute("role", "separator");

		// If a toolbar is vertically oriented, it has aria-orientation set to vertical. The default
		// value of aria-orientation for a toolbar is horizontal
		expect(queryByText(container, "Home")?.parentElement).not.toHaveAttribute("aria-orientation");

		// A parent menuitem has aria-haspopup set to menu
		expect(queryByText(container, "Subpages")).toHaveAttribute("aria-haspopup", "menu");

		// A parent menuitem has aria-controls set to the ID of the popout content
		expect(queryByText(container, "Subpages")).toHaveAttribute("aria-controls");

		// A parent menuitem has aria-expanded set to false when its child menu is not visible and set
		// to true when child menu is visible
		expect(queryByText(container, "Subpages")).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(getByText(container, "Subpages"));
		expect(queryByText(container, "Subpages")).toHaveAttribute("aria-expanded", "true");

		// Popout content has role="menu"
		expect(queryByText(container, "Subpage 1")?.parentElement?.parentElement).toHaveAttribute(
			"role",
			"menu",
		);

		// Popout content has aria-labelledby referring to the trigger
		const popoutTrigger = getByText(container, "Subpages");
		//const triggerId = popoutTrigger.getAttribute("aria-controls");
		const popoutContent = queryByText(container, "Subpage 1")?.parentElement?.parentElement;
		expect(popoutContent).toHaveAttribute("aria-labelledby", popoutTrigger?.id);
	});

	it("Vertical toolbar has aria-orientation=vertical", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarVertical);
		expect(container.querySelector('[role="toolbar"]')).toHaveAttribute(
			"aria-orientation",
			"vertical",
		);
	});
});
