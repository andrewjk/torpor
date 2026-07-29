import { queryAllByText, queryByText, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import PaginationBasic from "./components/PaginationBasic.torp";
import PaginationWithEllipsis from "./components/PaginationWithEllipsis.torp";
import PaginationWithTriggers from "./components/PaginationWithTriggers.torp";

describe("Pagination - Accessibility", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("has correct ARIA role and label", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const nav = within(container).getByRole("navigation");
		expect(nav).toBeInTheDocument();
		expect(nav).toHaveAttribute("aria-label", "Pagination");
	});

	it("active page has aria-current", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const activeItem = container.querySelector('[data-state="active"]');
		expect(activeItem).toBeInTheDocument();
		expect(activeItem).toHaveAttribute("aria-current", "page");
	});

	it("inactive pages are buttons", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const inactiveItems = container.querySelectorAll('[data-state="inactive"]');
		expect(inactiveItems.length).toBeGreaterThan(0);
		inactiveItems.forEach((item) => {
			expect(item.tagName.toLowerCase()).toBe("button");
		});
	});

	it("navigation triggers have aria-label", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithTriggers);

		const startButton = queryByText(container, "«");
		expect(startButton).toHaveAttribute("aria-label", "First page");

		const prevButton = queryByText(container, "‹");
		expect(prevButton).toHaveAttribute("aria-label", "Previous page");

		const nextButton = queryByText(container, "›");
		expect(nextButton).toHaveAttribute("aria-label", "Next page");

		const endButton = queryByText(container, "»");
		expect(endButton).toHaveAttribute("aria-label", "Last page");
	});

	it("ellipsis buttons render correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithEllipsis);

		expect(container.innerHTML.includes("…")).toBe(true);
	});

	it("page numbers have aria-label", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const pageButtons = container.querySelectorAll('.torp-pagination-item[data-type="number"]');
		pageButtons.forEach((button) => {
			expect(button).toHaveAttribute("aria-label");
		});
	});

	it("can be focused via tab key", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const pagination = container.querySelector(".torp-pagination");
		expect(pagination).toHaveAttribute("tabindex", "0");
	});
});
