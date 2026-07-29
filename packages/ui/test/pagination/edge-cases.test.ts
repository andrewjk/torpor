import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import PaginationBasic from "./components/PaginationBasic.torp";
import PaginationWithEllipsis from "./components/PaginationWithEllipsis.torp";
import PaginationCustomLabel from "./components/PaginationCustomLabel.torp";

describe("Pagination - Edge Cases", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("handles single page", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		expect(queryByText(container, "1")).toBeInTheDocument();
	});

	it("handles two pages", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		expect(queryByText(container, "1")).toBeInTheDocument();
		expect(queryByText(container, "2")).toBeInTheDocument();
	});

	it("handles large page count with maxPages", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithEllipsis);

		expect(queryByText(container, "1")).toBeInTheDocument();
		expect(queryByText(container, "50")).toBeInTheDocument();
		expect(container.innerHTML.includes("…")).toBe(true);
	});

	it("does not show ellipsis when all pages fit", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationBasic);

		expect(queryByText(container, "…")).not.toBeInTheDocument();
	});
});
