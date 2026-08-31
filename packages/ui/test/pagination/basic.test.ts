import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vite-plus/test";
import PaginationBasic from "./components/PaginationBasic.torp";
import PaginationEmpty from "./components/PaginationEmpty.torp";
import PaginationWithEllipsis from "./components/PaginationWithEllipsis.torp";
import PaginationWithTriggers from "./components/PaginationWithTriggers.torp";

describe("Pagination - Basic", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("renders all page numbers", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		expect(queryByText(container, "1")).toBeInTheDocument();
		expect(queryByText(container, "5")).toBeInTheDocument();
		expect(queryByText(container, "10")).toBeInTheDocument();
	});

	it("highlights current page as active", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const activeItem = container.querySelector('[data-state="active"]');
		expect(activeItem).toBeInTheDocument();
		expect(activeItem?.textContent?.trim()).toBe("1");
	});

	it("renders with navigation triggers", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithTriggers);

		expect(queryByText(container, "«")).toBeInTheDocument();
		expect(queryByText(container, "‹")).toBeInTheDocument();
		expect(queryByText(container, "›")).toBeInTheDocument();
		expect(queryByText(container, "»")).toBeInTheDocument();
	});

	it("renders ellipsis for large page counts", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithEllipsis);

		expect(queryByText(container, "1")).toBeInTheDocument();
		expect(queryByText(container, "50")).toBeInTheDocument();
		expect(container.innerHTML.includes("…")).toBe(true);
	});

	it("does not render when count is 0", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationEmpty);

		expect(container.querySelector(".torp-pagination")).not.toBeInTheDocument();
	});

	it("renders correct number of page buttons", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		const items = container.querySelectorAll(".torp-pagination-item");
		expect(items.length).toBe(10);
	});
});
