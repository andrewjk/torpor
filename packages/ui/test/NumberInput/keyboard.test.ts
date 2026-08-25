import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import NumberInputTest from "./components/NumberInputTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, NumberInputTest, { ...props, onchange });
	return { container, onchange, input: () => within(container).getByRole("spinbutton") };
}

describe("NumberInput (keyboard)", () => {
	it("ArrowUp increases and ArrowDown decreases by one step", async () => {
		const { input, onchange } = setup({ value: 10 });

		fireEvent.keyDown(input(), { key: "ArrowUp" });
		expect(input()).toHaveAttribute("aria-valuenow", "11");
		expect(onchange).toHaveBeenCalledWith(11);

		fireEvent.keyDown(input(), { key: "ArrowDown" });
		expect(input()).toHaveAttribute("aria-valuenow", "10");
	});

	it("honors the step prop, including decimals", async () => {
		const { input } = setup({ value: 1, step: 0.25 });

		fireEvent.keyDown(input(), { key: "ArrowUp" });

		expect(input()).toHaveAttribute("aria-valuenow", "1.25");
		expect(input()).toHaveValue("1.25");
	});

	it("PageUp and PageDown move in large steps", async () => {
		const { input } = setup({ value: 50 });

		fireEvent.keyDown(input(), { key: "PageUp" });
		expect(input()).toHaveAttribute("aria-valuenow", "60");

		fireEvent.keyDown(input(), { key: "PageDown" });
		expect(input()).toHaveAttribute("aria-valuenow", "50");
	});

	it("Home moves to the minimum and End to the maximum", async () => {
		const { input } = setup({ value: 5, min: 0, max: 10 });

		fireEvent.keyDown(input(), { key: "End" });
		expect(input()).toHaveAttribute("aria-valuenow", "10");

		fireEvent.keyDown(input(), { key: "Home" });
		expect(input()).toHaveAttribute("aria-valuenow", "0");
	});

	it("clamps stepped values to the min and max", async () => {
		const { input, onchange } = setup({ value: 9, min: 0, max: 10 });

		fireEvent.keyDown(input(), { key: "ArrowUp" });
		expect(input()).toHaveAttribute("aria-valuenow", "10");
		expect(onchange).toHaveBeenCalledWith(10);

		fireEvent.keyDown(input(), { key: "ArrowUp" });
		expect(input()).toHaveAttribute("aria-valuenow", "10");
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it("steps from zero when empty", async () => {
		const { input } = setup();

		fireEvent.keyDown(input(), { key: "ArrowUp" });

		expect(input()).toHaveAttribute("aria-valuenow", "1");
	});

	it("does nothing when disabled", async () => {
		const { input, onchange } = setup({ value: 10, disabled: true });

		fireEvent.keyDown(input(), { key: "ArrowUp" });

		expect(input()).toHaveAttribute("aria-valuenow", "10");
		expect(onchange).not.toHaveBeenCalled();
	});
});
