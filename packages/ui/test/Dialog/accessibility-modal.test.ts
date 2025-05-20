import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import DialogAccessibility from "./components/DialogAccessibility.torp";

describe("Dialog", () => {
	it("Accessibility -- modal", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DialogAccessibility, { modal: true, ariaAnnounce: false });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/
		// This is for a Dialog in a Popover with its modal property set to true

		// The element that serves as the dialog container has a role of dialog
		let dialog = queryByText(container, "Which color do you prefer?");
		assert(dialog, "Dialog not found");
		assert(dialog.parentElement, "Dialog parent not found");
		dialog = dialog.parentElement;
		expect(dialog).toHaveAttribute("role", "dialog");

		// All elements required to operate the dialog are descendants of the
		// element that has role dialog

		// The dialog container element has aria-modal set to true
		expect(dialog).toHaveAttribute("aria-modal", "true");

		// The dialog has either:
		//   * A value set for the aria-labelledby property that refers to a
		//     visible dialog title
		//   * A label specified by aria-label
		const header = queryByText(container, "Color preference");
		assert(header, "Header not found");
		expect(dialog).toHaveAttribute("aria-labelledby", header.id);

		// Optionally, the aria-describedby property is set on the element with
		// the dialog role to indicate which element or elements in the dialog
		// contain content that describes the primary purpose or message of the
		// dialog. Specifying descriptive elements enables screen readers to
		// announce the description along with the dialog title and initially
		// focused element when the dialog opens, which is typically helpful
		// only when the descriptive content is simple and can easily be
		// understood without structural information. It is advisable to omit
		// specifying aria-describedby if the dialog content includes semantic
		// structures, such as lists, tables, or multiple paragraphs, that need
		// to be perceived in order to easily understand the content, i.e., if
		// the content would be difficult to understand when announced as a
		// single unbroken string
		expect(dialog).not.toHaveAttribute("aria-describedby");
	});
});
