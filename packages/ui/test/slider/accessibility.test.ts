import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SliderTest from "./components/SliderTest.torp";

describe("Slider (accessibility)", () => {
	it("has a slider role with value attributes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, { min: 0, max: 100, value: 30 });

		const slider = within(container).getByRole("slider");
		expect(slider).toHaveAttribute("aria-valuemin", "0");
		expect(slider).toHaveAttribute("aria-valuemax", "100");
		expect(slider).toHaveAttribute("aria-valuenow", "30");
		expect(slider).toHaveAttribute("aria-orientation", "horizontal");
	});

	it("is focusable by default", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, {});

		expect(within(container).getByRole("slider")).toHaveAttribute("tabindex", "0");
	});

	it("has an accessible name from the ariaLabel prop", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, { ariaLabel: "Volume" });

		expect(within(container).getByRole("slider", { name: "Volume" })).toBeInTheDocument();
	});

	it("marks a disabled slider as disabled and unfocusable", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, { disabled: true, value: 50 });

		const slider = within(container).getByRole("slider");
		expect(slider).toHaveAttribute("aria-disabled", "true");
		expect(slider).toHaveAttribute("tabindex", "-1");
	});

	it("reports a vertical orientation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, { orientation: "vertical" });

		expect(within(container).getByRole("slider")).toHaveAttribute(
			"aria-orientation",
			"vertical",
		);
	});
});
