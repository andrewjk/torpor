import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import DialogAccessibility from "./components/DialogAccessibility.torp";

describe("Dialog", () => {
	it("Accessibility -- alert", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DialogAccessibility, { alert: true });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
		// This is for a Dialog with its alert property set to true

		// The element that contains all elements of the dialog, including the
		// alert message and any dialog buttons, has role alertdialog
		let dialog = queryByText(container, "Which color do you prefer?");
		assert(dialog, "Dialog not found");
		assert(dialog.parentElement, "Dialog parent not found");
		dialog = dialog.parentElement;
		expect(dialog).toHaveAttribute("role", "alertdialog");

		// The element with role alertdialog has either:
		//   * A value for aria-labelledby that refers to the element containing
		//     the title of the dialog if the dialog has a visible label
		//   * A value for aria-label if the dialog does not have a visible
		//     label
		const header = queryByText(container, "Color preference");
		assert(header, "Header not found");
		expect(dialog).toHaveAttribute("aria-labelledby", header.id);

		// The element with role alertdialog has a value set for
		// aria-describedby that refers to the element containing the alert
		// message
		const body = queryByText(container, "Which color do you prefer?");
		assert(body, "Body not found");
		expect(dialog).toHaveAttribute("aria-describedby", body.id);
	});
});
