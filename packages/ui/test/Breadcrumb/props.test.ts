import { queryByText, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import BreadcrumbWithProps from "./components/BreadcrumbWithProps.torp";

describe("Breadcrumb - Props", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("applies id to Breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const nav = within(container).getByRole("navigation");
		expect(nav).toHaveAttribute("id", "breadcrumb-nav");
	});

	it("applies class to Breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const nav = within(container).getByRole("navigation");
		expect(nav).toHaveClass("custom-breadcrumb");
		expect(nav).toHaveClass("torp-breadcrumb");
	});

	it("applies style to Breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const nav = within(container).getByRole("navigation");
		expect(nav).toHaveAttribute("style");
		expect(nav.getAttribute("style")).toContain("color");
	});

	it("applies id to BreadcrumbList", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const ol = container.querySelector("ol");
		expect(ol).toHaveAttribute("id", "breadcrumb-list");
	});

	it("applies class to BreadcrumbList", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const ol = container.querySelector("ol");
		expect(ol).toHaveClass("custom-list");
		expect(ol).toHaveClass("torp-breadcrumb-list");
	});

	it("applies id to BreadcrumbItem", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const item1 = queryByText(container, "Home")?.parentElement;
		expect(item1).toHaveAttribute("id", "item-1");

		const item2 = queryByText(container, "About")?.parentElement;
		expect(item2).toHaveAttribute("id", "item-2");
	});

	it("applies class to BreadcrumbItem", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const items = container.querySelectorAll("li.torp-breadcrumb");
		expect(items[0]).toHaveClass("custom-item");
		expect(items[1]).toHaveClass("custom-item");
	});

	it("applies style to BreadcrumbItem", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const item2 = queryByText(container, "About")?.parentElement;
		expect(item2).toHaveStyle({ "font-size": "14px" });
	});

	it("sets data-current when current prop is true", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const contactElement = container.querySelector('[data-current="current"]');
		expect(contactElement).toBeInTheDocument();
		expect(contactElement).toHaveAttribute("data-current", "current");
		expect(contactElement).toHaveTextContent("Contact");
	});

	it("does not set data-current when current prop is false or undefined", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbWithProps);

		const homeItem = queryByText(container, "Home")?.parentElement;
		expect(homeItem).not.toHaveAttribute("data-current");

		const aboutItem = queryByText(container, "About")?.parentElement;
		expect(aboutItem).not.toHaveAttribute("data-current");
	});
});
