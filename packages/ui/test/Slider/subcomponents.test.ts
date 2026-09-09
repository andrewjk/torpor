import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SliderComposedTest from "./components/SliderComposedTest.torp";
import SliderOrphanTest from "./components/SliderOrphanTest.torp";
import SliderTest from "./components/SliderTest.torp";

describe("Slider (subcomponents)", () => {
	it("renders the range and handle automatically with no children", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderTest, { min: 0, max: 100, value: 30 });

		const fill = container.getElementsByClassName("torp-slider-fill")[0] as HTMLElement;
		expect(fill).toBeInTheDocument();
		expect(fill.style.width).toBe("30%");
		expect(within(container).getByRole("slider")).toBeInTheDocument();
	});

	it("renders explicitly composed subcomponents with their own props", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderComposedTest, {
			min: 0,
			max: 100,
			value: 30,
			rangeClass: "custom-range",
			handleClass: "custom-handle",
		});

		const fill = container.getElementsByClassName("torp-slider-fill")[0] as HTMLElement;
		expect(fill).toHaveClass("custom-range");
		expect(fill.style.width).toBe("30%");

		const slider = within(container).getByRole("slider");
		expect(slider).toHaveClass("torp-slider-thumb", "custom-handle");
	});

	it("uses the handle ariaLabel over the slider ariaLabel", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderComposedTest, { ariaLabel: "Volume", handleLabel: "Balance" });

		expect(within(container).getByRole("slider", { name: "Balance" })).toBeInTheDocument();
	});

	it("falls back to the slider ariaLabel when the handle has none", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderComposedTest, { ariaLabel: "Volume" });

		expect(within(container).getByRole("slider", { name: "Volume" })).toBeInTheDocument();
	});

	it("throws when a handle is used outside a slider", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		expect(() => mount(container, SliderOrphanTest, {})).toThrow(
			"SliderHandle must be contained within a Slider",
		);
	});
});
