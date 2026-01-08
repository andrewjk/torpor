import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import BreadcrumbMultipleCurrent from "./components/BreadcrumbMultipleCurrent.torp";
import BreadcrumbTest from "./components/BreadcrumbTest.torp";
import EmptyBreadcrumb from "./components/EmptyBreadcrumb.torp";
import NonLinkBreadcrumb from "./components/NonLinkBreadcrumb.torp";
import SingleItemBreadcrumb from "./components/SingleItemBreadcrumb.torp";

describe("Breadcrumb - Edge Cases", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("handles empty breadcrumb gracefully", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, EmptyBreadcrumb);

		const nav = within(container).getByRole("navigation");
		expect(nav).toBeInTheDocument();
		expect(nav.querySelectorAll("li").length).toBe(0);
	});

	it("handles single item breadcrumb", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SingleItemBreadcrumb);

		const nav = within(container).getByRole("navigation");
		const items = nav.querySelectorAll("li");
		expect(items.length).toBe(1);
	});

	it("handles breadcrumb without links", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NonLinkBreadcrumb);

		const nav = within(container).getByRole("navigation");
		const home = within(nav).getByText("Home");
		expect(home.tagName.toLowerCase()).toBe("span");
	});

	it("handles breadcrumb without ariaLabel", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = `
			<nav class="torp-breadcrumb">
				<ol class="torp-breadcrumb-list">
					<li class="torp-breadcrumb"><a href="#home">Home</a></li>
				</ol>
			</nav>
		`;

		const nav = within(container).getByRole("navigation");
		expect(nav).not.toHaveAttribute("aria-label");
	});

	it("handles breadcrumb without separators (CSS-styled)", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		const nav = within(container).getByRole("navigation");
		const separators = nav.querySelectorAll(".torp-breadcrumb-separator");
		expect(separators.length).toBe(0);
	});

	it("handles multiple current items (invalid but should not crash)", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbMultipleCurrent);

		const currentItems = container.querySelectorAll('[aria-current="page"]');
		expect(currentItems.length).toBe(2);
	});

	it("breadcrumb without BreadcrumbList wrapper", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = `
			<nav class="torp-breadcrumb" aria-label="Breadcrumb">
				<li class="torp-breadcrumb"><a href="#home">Home</a></li>
				<li class="torp-breadcrumb" aria-current="page">Page</li>
			</nav>
		`;

		const nav = within(container).getByRole("navigation");
		const items = nav.querySelectorAll("li");
		expect(items.length).toBe(2);
	});
});
