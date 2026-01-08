import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import BreadcrumbWithSeparators from "./components/BreadcrumbWithSeparators.torp";

describe("Breadcrumb - Separator", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("renders separator content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithSeparators);

		const separators = container.querySelectorAll(".torp-breadcrumb-separator");
		expect(separators.length).toBe(2);
		expect(separators[0]).toHaveTextContent("/");
		expect(separators[1]).toHaveTextContent("→");
	});

	it("applies id to BreadcrumbSeparator", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithSeparators);

		const sep1 = container.querySelector("#sep-1");
		expect(sep1).toBeInTheDocument();
	});

	it("applies class to BreadcrumbSeparator", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithSeparators);

		const separators = container.querySelectorAll(".torp-breadcrumb-separator");
		expect(separators[1]).toHaveClass("custom-separator");
	});

	it("has aria-hidden attribute", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithSeparators);

		const separators = container.querySelectorAll(".torp-breadcrumb-separator");
		separators.forEach((sep) => {
			expect(sep).toHaveAttribute("aria-hidden", "true");
		});
	});

	it("is hidden from screen readers", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithSeparators);

		const nav = within(container).getByRole("navigation");
		const separators = container.querySelectorAll(".torp-breadcrumb-separator");
		expect(separators.length).toBe(2);

		separators.forEach((sep) => {
			expect(nav.contains(sep)).toBe(true);
			expect(sep.getAttribute("aria-hidden")).toBe("true");
		});
	});
});
