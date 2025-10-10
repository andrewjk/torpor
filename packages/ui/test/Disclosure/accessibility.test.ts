import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DisclosureTest from "./components/DisclosureTest.torp";

describe("Disclosure", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DisclosureTest);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

		// The element that shows and hides the content has role button
		expect(queryByText(container, "Disclosure header")?.tagName.toLowerCase()).toMatch("button");

		// When the content is hidden, the element with role button has aria-expanded set to false
		expect(queryByText(container, "Disclosure header")).toHaveAttribute("aria-expanded", "false");

		// When the content area is visible, it is set to true
		await userEvent.click(getByText(container, "Disclosure header"));
		expect(queryByText(container, "Disclosure header")).toHaveAttribute("aria-expanded", "true");

		// Optionally, the element with role button has a value specified for aria-controls that refers
		// to the element that contains all the content that is shown or hidden
		const contentId = queryByText(container, "Disclosure content")?.id;
		expect(queryByText(container, "Disclosure header")).toHaveAttribute("aria-controls", contentId);
	});
});
