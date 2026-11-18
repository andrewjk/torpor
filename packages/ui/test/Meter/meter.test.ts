import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import MeterTest from "./components/MeterTest.torp";

function mountMeter(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, MeterTest as any, props);
	return container;
}

describe("Meter", () => {
	it("renders a meter with its range and value", () => {
		const container = mountMeter({ value: 30, min: 0, max: 60, valuetext: "30 GB" });
		const meter = within(container).getByRole("meter", { name: "Disk usage" });

		expect(meter).toHaveAttribute("aria-valuemin", "0");
		expect(meter).toHaveAttribute("aria-valuemax", "60");
		expect(meter).toHaveAttribute("aria-valuenow", "30");
		expect(meter).toHaveAttribute("aria-valuetext", "30 GB");
		expect(container.querySelector(".torp-meter-bar")).toHaveStyle({ width: "50%" });
	});

	it("clamps values to the range", () => {
		const container = mountMeter({ value: 150, min: 0, max: 100 });
		expect(within(container).getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
	});

	it("rates the value against the thresholds", () => {
		const container = mountMeter({ value: 10, low: 25, high: 75, optimum: 100 });
		expect(within(container).getByRole("meter")).toHaveAttribute("data-state", "poor");

		const container2 = mountMeter({ value: 90, low: 25, high: 75, optimum: 100 });
		expect(within(container2).getByRole("meter")).toHaveAttribute("data-state", "optimum");
	});
});
