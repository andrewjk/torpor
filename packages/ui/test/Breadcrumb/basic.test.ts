import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import BreadcrumbTest from "./components/BreadcrumbTest.torp";

describe("Breadcrumb", () => {
	it("Basic", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BreadcrumbTest);

		expect(queryByText(container, "Main page")).toBeInTheDocument();
		expect(queryByText(container, "Sub page")).toBeInTheDocument();
		expect(queryByText(container, "Current page")).toBeInTheDocument();
	});
});
