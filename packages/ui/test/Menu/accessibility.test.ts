import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import MenuAccessibility from "./components/MenuAccessibility.torp";

describe("Menu", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuAccessibility);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/menu/

		// A menu is a container of items that represent choices. The element serving as the menu has
		// a role of either menu or menubar
		expect(queryByText(container, "Menu button")?.parentElement).toHaveAttribute("role", "menu");

		// The items contained in a menu are child elements of the containing menu or menubar and have
		// any of the following roles:
		//   * menuitem
		//   * menuitemcheckbox
		//   * menuitemradio
		expect(queryByText(container, "Menu button")).toHaveAttribute("role", "menuitem");
		expect(queryByText(container, "Check popout button")).toHaveAttribute("role", "menuitem");

		// If activating a menuitem opens a submenu, the menuitem is known as a parent menuitem. A submenu's
		// menu element is:
		//   * Contained inside the same menu element as its parent menuitem
		//   * Is the sibling element immediately following its parent menuitem

		// A parent menuitem has aria-haspopup set to either menu or true
		expect(queryByText(container, "Check popout button")).toHaveAttribute("aria-haspopup", "true");

		// A parent menuitem has aria-expanded set to false when its child menu is not visible and set
		// to true when the child menu is visible
		expect(queryByText(container, "Check popout button")).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(getByText(container, "Check popout button"));
		expect(queryByText(container, "Check popout button")).toHaveAttribute("aria-expanded", "true");

		// One of the following approaches is used to enable scripts to move focus among items in a
		// menu as described in Keyboard Navigation Inside Components:
		//   * The menu container has tabindex set to -1 or 0 and aria-activedescendant set to the ID
		//     of the focused item
		//   * Each item in the menu has tabindex set to -1, except in a menubar, where the first item
		//     has tabindex set to 0

		// When a menuitemcheckbox or menuitemradio is checked, aria-checked is set to true
		// NOTE: We don't (currently?) have checkboxes or radios in Menus

		// When a menu item is disabled, aria-disabled is set to true
		expect(queryByText(container, "Menu button")).not.toHaveAttribute("aria-disabled");
		expect(queryByText(container, "Disabled button")).toHaveAttribute("aria-disabled", "true");

		// Items in a menu may be divided into groups by placing an element with a role of separator
		// between groups. For example, this technique should be used when a menu contains a set of
		// menuitemradio items
		expect(queryByText(container, "---")).toHaveAttribute("role", "separator");

		// All separators should have aria-orientation consistent with the separator's orientation
		// NOTE: What does this mean? None of the example separators have aria-orientation set

		// An element with role menu either has:
		//   * aria-labelledby set to a value that refers to the menuitem or button that controls its
		//     display
		//   * A label provided by aria-label
		// NOTE: We only support aria-label and it's required
		expect(queryByText(container, "Menu button")?.parentElement).toHaveAttribute(
			"aria-label",
			"A menu",
		);

		// If a menu is horizontally oriented, it has aria-orientation set to horizontal. The default
		// value of aria-orientation for a menu is vertical
		// NOTE: For these menus, the only orientation is vertical -- can't really think of a situation
		// where horizontal would make sense?
		expect(queryByText(container, "Menu button")?.parentElement).toHaveAttribute(
			"aria-orientation",
			"vertical",
		);
	});
});
