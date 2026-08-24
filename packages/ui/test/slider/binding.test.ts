import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SliderBindingTest from "./components/SliderBindingTest.torp";

describe("Slider (binding)", () => {
	it("uses the initial bound value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderBindingTest);

		expect(within(container).getByRole("slider")).toHaveAttribute("aria-valuenow", "25");
		expect(within(container).getByText("25")).toBeInTheDocument();
	});

	it("writes keyboard changes back to the bound state", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderBindingTest);

		const slider = within(container).getByRole("slider");
		fireEvent.keyDown(slider, { key: "End" });

		expect(slider).toHaveAttribute("aria-valuenow", "50");
		expect(within(container).getByText("50")).toBeInTheDocument();
	});
});
