import { queryByText, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import BreadcrumbTest from "./components/BreadcrumbTest.torp";
import EmptyBreadcrumb from "./components/EmptyBreadcrumb.torp";
import SingleItemBreadcrumb from "./components/SingleItemBreadcrumb.torp";

describe("Breadcrumb - Accessibility", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("follows WAI ARIA breadcrumb pattern", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		const nav = within(container).getByRole("navigation", { name: "Breadcrumb" });
		expect(nav).toBeInTheDocument();

		const mainPage = queryByText(container, "Main page");
		expect(mainPage?.tagName.toLowerCase()).toBe("a");
		expect(mainPage).not.toHaveAttribute("aria-current");

		const subPage = queryByText(container, "Sub page");
		expect(subPage?.tagName.toLowerCase()).toBe("a");
		expect(subPage).not.toHaveAttribute("aria-current");

		const currentPage = queryByText(container, "Current page");
		expect(currentPage).toHaveAttribute("aria-current", "page");
	});

	it("has correct HTML structure (nav > li)", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		const nav = within(container).getByRole("navigation");
		expect(nav.tagName.toLowerCase()).toBe("nav");

		const items = nav.querySelectorAll("li");
		expect(items.length).toBe(3);
		items.forEach((item) => {
			expect(item).toHaveClass("torp-breadcrumb");
		});
	});

	it("handles single item breadcrumb accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SingleItemBreadcrumb);

		const nav = within(container).getByRole("navigation");
		expect(nav).toBeInTheDocument();

		const home = queryByText(container, "Home");
		expect(home).toHaveAttribute("aria-current", "page");
	});

	it("handles empty breadcrumb accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, EmptyBreadcrumb);

		const nav = within(container).getByRole("navigation");
		expect(nav).toBeInTheDocument();
	});
});
