import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SegmentedControlBindingTest from "./components/SegmentedControlBindingTest.torp";

describe("SegmentedControl (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SegmentedControlBindingTest, {});

		expect(within(container).getByText("week")).toBeInTheDocument();

		fireEvent.click(within(container).getByRole("radio", { name: "Month" }));

		expect(within(container).getByText("month")).toBeInTheDocument();
	});
});
