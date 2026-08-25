import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SegmentedControlTest from "./components/SegmentedControlTest.torp";

describe("SegmentedControl (accessibility)", () => {
	it("is a radiogroup with an accessible name and labelled radios", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SegmentedControlTest, {});

		expect(within(container).getByRole("radiogroup", { name: "View" })).toBeInTheDocument();
		expect(within(container).getByRole("radio", { name: "Day" })).toBeInTheDocument();
		expect(within(container).getByRole("radio", { name: "Week" })).toBeInTheDocument();
		expect(within(container).getByRole("radio", { name: "Month" })).toBeInTheDocument();
	});

	it("marks a disabled control", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SegmentedControlTest, { disabled: true });

		expect(within(container).getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
	});
});
