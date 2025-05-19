import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionAccessibility from "./components/AccordionAccessibility.torp";

describe("Accordion", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionAccessibility, { value: ["1", "3"] });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

		// The title of each accordion header is contained in an element with role button
		expect(queryByText(container, "Role Header")?.tagName.toLowerCase()).toMatch("button");

		// Each accordion header button is wrapped in an element with role heading that has a value set
		// for aria-level that is appropriate for the information architecture of the page
		//   * If the native host language has an element with an implicit heading and aria-level, such
		//     as an HTML heading tag, a native host language element may be used
		//   * The button element is the only element inside the heading element. That is, if there are
		//     other visually persistent elements, they are not included inside the heading element
		// NOTE: This is kind of up to the user -- should we check this at runtime?
		expect(queryByText(container, "Role Header")?.parentElement?.tagName.toLowerCase()).toMatch(
			"h4",
		);
		expect(
			queryByText(container, "Role Header")?.parentElement?.childElementCount.toString(),
		).toMatch("1");

		// If the accordion panel associated with an accordion header is visible, the header button
		// element has aria-expanded set to true. If the panel is not visible, aria-expanded is set
		// to false
		expect(queryByText(container, "Open Header")).toHaveAttribute("aria-expanded", "true");
		expect(queryByText(container, "Closed Header")).toHaveAttribute("aria-expanded", "false");

		// The accordion header button element has aria-controls set to the ID of the element containing
		// the accordion panel content
		const headerId = queryByText(container, "Open Header")?.id;
		const contentId = queryByText(container, "Open Content")?.id;
		expect(queryByText(container, "Open Header")).toHaveAttribute("aria-controls", contentId);

		// If the accordion panel associated with an accordion header is visible, and if the accordion
		// does not permit the panel to be collapsed, the header button element has aria-disabled set
		// to true
		expect(queryByText(container, "Disabled Header")).toHaveAttribute("aria-disabled", "true");

		// Optionally, each element that serves as a container for panel content has role region and
		// aria-labelledby with a value that refers to the button that controls display of the panel
		//   * Avoid using the region role in circumstances that create landmark region proliferation,
		//     e.g., in an accordion that contains more than approximately 6 panels that can be expanded
		//     at the same time
		//   * Role region is especially helpful to the perception of structure by screen reader users
		//     when panels contain heading elements or a nested accordion
		expect(queryByText(container, "Open Content")).toHaveAttribute("aria-labelledby", headerId);
		expect(queryByText(container, "Region Content")).toHaveAttribute("role", "region");
	});
});
