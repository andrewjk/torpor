import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import BreadcrumbTest from "./components/BreadcrumbTest.torp";

describe("Breadcrumb", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

		// Breadcrumb trail is contained within a navigation landmark region
		expect(
			queryByText(container, "Main page")?.parentElement?.parentElement?.tagName.toLowerCase(),
		).toMatch("nav");

		// The landmark region is labelled via aria-label or aria-labelledby
		expect(queryByText(container, "Main page")?.parentElement?.parentElement).toHaveAttribute(
			"aria-label",
		);

		// The link to the current page has aria-current set to page. If the element representing the
		// current page is not a link, aria-current is optional
		expect(queryByText(container, "Current page")).toHaveAttribute("aria-current", "page");
	});
});
