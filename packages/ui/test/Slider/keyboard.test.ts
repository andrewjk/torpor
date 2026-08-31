import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import SliderTest from "./components/SliderTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SliderTest, { ...props, onchange });
	return { container, onchange, slider: () => within(container).getByRole("slider") };
}

describe("Slider (keyboard)", () => {
	it("ArrowRight increases the value by one step", async () => {
		const { slider, onchange } = setup({ value: 10 });

		fireEvent.keyDown(slider(), { key: "ArrowRight" });

		expect(slider()).toHaveAttribute("aria-valuenow", "11");
		expect(onchange).toHaveBeenCalledWith(11);
	});

	it("ArrowLeft decreases the value by one step", async () => {
		const { slider } = setup({ value: 10 });

		fireEvent.keyDown(slider(), { key: "ArrowLeft" });

		expect(slider()).toHaveAttribute("aria-valuenow", "9");
	});

	it("ArrowUp increases and ArrowDown decreases the value", async () => {
		const { slider } = setup({ value: 10 });

		fireEvent.keyDown(slider(), { key: "ArrowUp" });
		expect(slider()).toHaveAttribute("aria-valuenow", "11");

		fireEvent.keyDown(slider(), { key: "ArrowDown" });
		expect(slider()).toHaveAttribute("aria-valuenow", "10");
	});

	it("Home moves to the minimum and End moves to the maximum", async () => {
		const { slider } = setup({ value: 50, min: 0, max: 100 });

		fireEvent.keyDown(slider(), { key: "End" });
		expect(slider()).toHaveAttribute("aria-valuenow", "100");

		fireEvent.keyDown(slider(), { key: "Home" });
		expect(slider()).toHaveAttribute("aria-valuenow", "0");
	});

	it("PageUp and PageDown move in large steps", async () => {
		const { slider } = setup({ value: 50, step: 1 });

		fireEvent.keyDown(slider(), { key: "PageUp" });
		expect(slider()).toHaveAttribute("aria-valuenow", "60");

		fireEvent.keyDown(slider(), { key: "PageDown" });
		expect(slider()).toHaveAttribute("aria-valuenow", "50");
	});

	it("clamps the value at the minimum and maximum", async () => {
		const { slider } = setup({ value: 0, min: 0, max: 100 });

		fireEvent.keyDown(slider(), { key: "ArrowLeft" });
		expect(slider()).toHaveAttribute("aria-valuenow", "0");

		fireEvent.keyDown(slider(), { key: "End" });
		fireEvent.keyDown(slider(), { key: "ArrowUp" });
		expect(slider()).toHaveAttribute("aria-valuenow", "100");
	});

	it("honors the step prop", async () => {
		const { slider } = setup({ value: 10, step: 5 });

		fireEvent.keyDown(slider(), { key: "ArrowRight" });

		expect(slider()).toHaveAttribute("aria-valuenow", "15");
	});

	it("does nothing when disabled", async () => {
		const { slider, onchange } = setup({ value: 10, disabled: true });

		fireEvent.keyDown(slider(), { key: "ArrowRight" });

		expect(slider()).toHaveAttribute("aria-valuenow", "10");
		expect(onchange).not.toHaveBeenCalled();
	});
});
