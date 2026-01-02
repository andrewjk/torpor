import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import ComboBoxAccessibility from "./components/ComboBoxAccessibility.torp";

describe("ComboBox", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxAccessibility, { value: [1, 3] });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		const list = button.nextElementSibling;
		expect(list).toHaveAttribute("aria-hidden", "true");

		// The element that serves as an input and displays the combobox value has role combobox
		expect(button).toHaveAttribute("role", "combobox");

		// The combobox element has aria-controls set to a value that refers to
		// the element that serves as the popup. Note that aria-controls only
		// needs to be set when the popup is visible. However, it is valid to
		// reference an element that is not visible
		await userEvent.click(button);
		let listbox = queryByText(container, "Item 1")?.parentElement;
		assert(listbox, "listbox not found");
		expect(button).toHaveAttribute("aria-controls", listbox.id);

		// The popup is an element that has role listbox, tree, grid, or dialog
		expect(listbox).toHaveAttribute("role", "listbox");

		// NOTE: N/A:
		// If the popup has a role other than listbox, the element with role
		// combobox has aria-haspopup set to a value that corresponds to the
		// popup type. That is, aria-haspopup is set to grid, tree, or dialog.
		// Note that elements with role combobox have an implicit aria-haspopup
		// value of listbox

		// When the combobox popup is not visible, the element with role
		// combobox has aria-expanded set to false. When the popup element is
		// visible, aria-expanded is set to true. Note that elements with role
		// combobox have a default value for aria-expanded of false
		// HACK: await userEvent.click(button); // hide
		expect(list).toHaveAttribute("aria-hidden", "true");
		expect(button).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(button); // show
		expect(list).not.toHaveAttribute("aria-hidden");
		expect(button).toHaveAttribute("aria-expanded", "true");

		// TODO: Focus and autocomplete things

		// When a combobox receives focus, DOM focus is placed on the combobox
		// element

		// When a descendant of a listbox, grid, or tree popup is focused, DOM
		// focus remains on the combobox and the combobox has
		// aria-activedescendant set to a value that refers to the focused
		// element within the popup

		// For a combobox that controls a listbox, grid, or tree popup, when a
		// suggested value is visually indicated as the currently selected
		// value, the option, gridcell, row, or treeitem containing that value
		// has aria-selected set to true

		// If the combobox has a visible label and the combobox element is an
		// HTML element that can be labelled using the HTML label element (e.g.,
		// the input element), it is labeled using the label element. Otherwise,
		// if it has a visible label, the combobox element has aria-labelledby
		// set to a value that refers to the labelling element. Otherwise, the
		// combobox element has a label provided by aria-label

		// The combobox element has aria-autocomplete set to a value that
		// corresponds to its autocomplete behavior:
		// - none: When the popup is displayed, the suggested values it contains
		//   are the same regardless of the characters typed in the combobox.
		// - list: When the popup is triggered, it presents suggested values. If
		//   the combobox is editable, the values complete or logically
		//   correspond to the characters typed in the combobox.
		// - both: When the popup is triggered, it presents suggested values
		//   that complete or logically correspond to the characters typed in
		//   the combobox. In addition, the portion of the selected suggestion
		//   that has not been typed by the user, known as the "completion
		//   string", appears inline after the input cursor in the combobox. The
		//   inline completion string is visually highlighted and has a selected
		//   state.
	});
});
