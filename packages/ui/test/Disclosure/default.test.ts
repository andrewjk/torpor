import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DisclosureTest from "./components/DisclosureTest.torp";

describe("Disclosure", () => {
	it("Default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DisclosureTest, { expanded: true });

		expect(queryByText(container, "Disclosure content")).toBeInTheDocument();
	});
});
