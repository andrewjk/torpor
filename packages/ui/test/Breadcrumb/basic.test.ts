import { queryByText, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import BreadcrumbTest from "./components/BreadcrumbTest.torp";
import EmptyBreadcrumb from "./components/EmptyBreadcrumb.torp";
import NonLinkBreadcrumb from "./components/NonLinkBreadcrumb.torp";
import SingleItemBreadcrumb from "./components/SingleItemBreadcrumb.torp";

describe("Breadcrumb - Basic", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("renders all breadcrumb items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		expect(queryByText(container, "Main page")).toBeInTheDocument();
		expect(queryByText(container, "Sub page")).toBeInTheDocument();
		expect(queryByText(container, "Current page")).toBeInTheDocument();
	});

	it("renders empty breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, EmptyBreadcrumb);

		const nav = within(container).getByRole("navigation");
		expect(nav).toBeInTheDocument();
		expect(nav.querySelectorAll("li").length).toBe(0);
	});

	it("renders single item breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SingleItemBreadcrumb);

		expect(queryByText(container, "Home")).toBeInTheDocument();
	});

	it("renders breadcrumb with non-link content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NonLinkBreadcrumb);

		const home = queryByText(container, "Home");
		const current = queryByText(container, "Current");
		expect(home).toBeInTheDocument();
		expect(current).toBeInTheDocument();
		expect(home?.tagName.toLowerCase()).toBe("span");
	});
});
