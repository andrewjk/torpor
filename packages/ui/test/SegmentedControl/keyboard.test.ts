import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import SegmentedControlTest from "./components/SegmentedControlTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SegmentedControlTest, { ...props, onchange });
	return { container, onchange, items: () => within(container).getAllByRole("radio") };
}

describe("SegmentedControl (keyboard)", () => {
	it("ArrowRight selects and focuses the next segment", async () => {
		const { items, onchange } = setup();

		fireEvent.keyDown(items()[0], { key: "ArrowRight" });

		expect(items()[1]).toHaveAttribute("aria-checked", "true");
		expect(items()[1]).toHaveFocus();
		expect(onchange).toHaveBeenCalledWith("week");
	});

	it("ArrowLeft selects and focuses the previous segment", async () => {
		const { items } = setup({ value: "month" });

		fireEvent.keyDown(items()[2], { key: "ArrowLeft" });

		expect(items()[1]).toHaveAttribute("aria-checked", "true");
		expect(items()[1]).toHaveFocus();
	});

	it("ArrowUp and ArrowDown behave like Left and Right", async () => {
		const { items } = setup();

		fireEvent.keyDown(items()[0], { key: "ArrowDown" });
		expect(items()[1]).toHaveAttribute("aria-checked", "true");

		fireEvent.keyDown(items()[1], { key: "ArrowUp" });
		expect(items()[0]).toHaveAttribute("aria-checked", "true");
	});

	it("does not move past the ends", async () => {
		const { items } = setup();

		fireEvent.keyDown(items()[0], { key: "ArrowLeft" });
		expect(items()[0]).toHaveAttribute("aria-checked", "true");

		fireEvent.keyDown(items()[0], { key: "End" });
		expect(items()[2]).toHaveAttribute("aria-checked", "true");

		fireEvent.keyDown(items()[2], { key: "ArrowRight" });
		expect(items()[2]).toHaveAttribute("aria-checked", "true");
	});

	it("Home selects the first segment and End the last", async () => {
		const { items } = setup({ value: "month" });

		fireEvent.keyDown(items()[2], { key: "Home" });
		expect(items()[0]).toHaveAttribute("aria-checked", "true");
		expect(items()[0]).toHaveFocus();

		fireEvent.keyDown(items()[0], { key: "End" });
		expect(items()[2]).toHaveAttribute("aria-checked", "true");
	});

	it("skips disabled segments", async () => {
		const { items } = setup({ disableDay: true, value: "week" });

		fireEvent.keyDown(items()[1], { key: "ArrowLeft" });

		expect(items()[0]).toHaveAttribute("aria-checked", "false");
		expect(items()[1]).toHaveAttribute("aria-checked", "true");
	});

	it("moves the tab stop to the active segment", async () => {
		const { items } = setup();

		expect(items()[0]).toHaveAttribute("tabindex", "0");
		expect(items()[1]).toHaveAttribute("tabindex", "-1");

		fireEvent.click(items()[1]);

		expect(items()[1]).toHaveAttribute("tabindex", "0");
		expect(items()[0]).toHaveAttribute("tabindex", "-1");
	});
});
