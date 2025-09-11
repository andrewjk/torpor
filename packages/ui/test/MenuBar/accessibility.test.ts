import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import MenuBarAccessibility from "./components/MenuBarAccessibility.torp";

describe("MenuBar", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarAccessibility);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/menu/
		// NOTE: MenuBar is a menubar

		// A menu is a container of items that represent choices. The element serving as the menu has
		// a role of either menu or menubar
		expect(queryByText(container, "Top level")?.parentElement?.parentElement).toHaveAttribute(
			"role",
			"menubar",
		);

		// The items contained in a menu are child elements of the containing menu or menubar and have
		// any of the following roles:
		//   * menuitem
		//   * menuitemcheckbox
		//   * menuitemradio
		expect(queryByText(container, "Top level")).toHaveAttribute("role", "menuitem");

		// If activating a menuitem opens a submenu, the menuitem is known as a parent menuitem. A submenu's
		// menu element is:
		//   * Contained inside the same menu element as its parent menuitem
		//   * Is the sibling element immediately following its parent menuitem

		// A parent menuitem has aria-haspopup set to either menu or true
		expect(queryByText(container, "Top level")).toHaveAttribute("aria-haspopup", "true");

		// A parent menuitem has aria-expanded set to false when its child menu is not visible and set
		// to true when the child menu is visible
		expect(queryByText(container, "Top level")).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(getByText(container, "Top level"));
		expect(queryByText(container, "Top level")).toHaveAttribute("aria-expanded", "true");

		// One of the following approaches is used to enable scripts to move focus among items in a
		// menu as described in Keyboard Navigation Inside Components:
		//   * The menu container has tabindex set to -1 or 0 and aria-activedescendant set to the ID
		//     of the focused item
		//   * Each item in the menu has tabindex set to -1, except in a menubar, where the first item
		//     has tabindex set to 0

		// When a menuitemcheckbox or menuitemradio is checked, aria-checked is set to true
		// NOTE: We don't (currently?) have checkboxes or radios in MenuBars

		// When a menu item is disabled, aria-disabled is set to true
		expect(queryByText(container, "Top level")).not.toHaveAttribute("aria-disabled");
		expect(queryByText(container, "Disabled")).toHaveAttribute("aria-disabled", "true");

		// Items in a menu may be divided into groups by placing an element with a role of separator
		// between groups. For example, this technique should be used when a menu contains a set of
		// menuitemradio items
		expect(queryByText(container, "---")).toHaveAttribute("role", "separator");

		// All separators should have aria-orientation consistent with the separator's orientation
		// NOTE: What does this mean? None of the example separators have aria-orientation set

		// If a menubar has a visible label, the element with role menubar has aria-labelledby set to
		// a value that refers to the labelling element. Otherwise, the menubar element has a label
		// provided by aria-label
		// NOTE: We only support aria-label and it's required
		expect(queryByText(container, "Top level")?.parentElement?.parentElement).toHaveAttribute(
			"aria-label",
			"Window menu",
		);

		// If a menubar is vertically oriented, it has aria-orientation set to vertical. The default
		// value of aria-orientation for a menubar is horizontal
		expect(queryByText(container, "Top level")?.parentElement?.parentElement).toHaveAttribute(
			"aria-orientation",
			"horizontal",
		);
		expect(queryByText(container, "Sub item 1")?.parentElement).toHaveAttribute(
			"aria-orientation",
			"vertical",
		);
	});
});
