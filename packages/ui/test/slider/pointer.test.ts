import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import SliderTest from "./components/SliderTest.torp";

function setup(props: Record<string, unknown> = {}, rect = { left: 0, top: 0, width: 100, height: 10 }) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SliderTest, { ...props, onchange });

	// jsdom has no layout, so give the track a size
	const track = container.getElementsByClassName("torp-slider")[0] as HTMLElement;
	track.getBoundingClientRect = () => ({
		x: rect.left,
		y: rect.top,
		left: rect.left,
		top: rect.top,
		right: rect.left + rect.width,
		bottom: rect.top + rect.height,
		width: rect.width,
		height: rect.height,
		toJSON: () => ({}),
	} as DOMRect);

	return { container, onchange, slider: () => within(container).getByRole("slider") };
}

describe("Slider (pointer)", () => {
	it("sets the value from a click position on the track", async () => {
		const { slider } = setup({ min: 0, max: 100 });

		fireEvent.mouseDown(slider(), { clientX: 50, clientY: 0 });

		expect(slider()).toHaveAttribute("aria-valuenow", "50");
	});

	it("snaps to the nearest step", async () => {
		const { slider } = setup({ min: 0, max: 100, step: 25 });

		// 40% of the range is 40, which rounds up to the 50 multiple of 25
		fireEvent.mouseDown(slider(), { clientX: 40, clientY: 0 });

		expect(slider()).toHaveAttribute("aria-valuenow", "50");
	});

	it("drags the thumb with mouse move and stops on mouse up", async () => {
		const { slider, onchange } = setup({ min: 0, max: 100 });

		fireEvent.mouseDown(slider(), { clientX: 20, clientY: 0 });
		fireEvent.mouseMove(window, { clientX: 80, clientY: 0 });
		expect(slider()).toHaveAttribute("aria-valuenow", "80");

		fireEvent.mouseUp(window);
		fireEvent.mouseMove(window, { clientX: 10, clientY: 0 });

		// After mouse up the value should no longer change
		expect(slider()).toHaveAttribute("aria-valuenow", "80");
		expect(onchange).toHaveBeenLastCalledWith(80);
	});

	it("clamps positions outside the track", async () => {
		const { slider } = setup({ min: 0, max: 100 });

		fireEvent.mouseDown(slider(), { clientX: -50, clientY: 0 });
		expect(slider()).toHaveAttribute("aria-valuenow", "0");

		fireEvent.mouseDown(slider(), { clientX: 200, clientY: 0 });
		expect(slider()).toHaveAttribute("aria-valuenow", "100");
	});

	it("maps clicks onto a custom range", async () => {
		const { slider } = setup({ min: 10, max: 20 });

		fireEvent.mouseDown(slider(), { clientX: 50, clientY: 0 });

		expect(slider()).toHaveAttribute("aria-valuenow", "15");
	});

	it("works with a vertical orientation", async () => {
		const { slider } = setup({ min: 0, max: 100, orientation: "vertical" }, { left: 0, top: 0, width: 10, height: 200 });

		fireEvent.mouseDown(slider(), { clientX: 0, clientY: 150 });

		expect(slider()).toHaveAttribute("aria-valuenow", "75");
	});

	it("does nothing when disabled", async () => {
		const { slider, onchange } = setup({ disabled: true });

		fireEvent.mouseDown(slider(), { clientX: 50, clientY: 0 });

		expect(onchange).not.toHaveBeenCalled();
	});
});
