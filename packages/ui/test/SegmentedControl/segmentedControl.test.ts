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
	return {
		container,
		onchange,
		items: () => within(container).getAllByRole("radio"),
	};
}

describe("SegmentedControl", () => {
	it("activates the first segment when there is no value", async () => {
		const { items } = setup();

		expect(items()[0]).toHaveAttribute("aria-checked", "true");
	});

	it("activates the segment matching the value", async () => {
		const { items } = setup({ value: "month" });

		expect(items()[2]).toHaveAttribute("aria-checked", "true");
	});

	it("selects a segment on click", async () => {
		const { items, onchange } = setup();

		fireEvent.click(items()[1]);

		expect(items()[1]).toHaveAttribute("aria-checked", "true");
		expect(onchange).toHaveBeenCalledWith("week");
	});

	it("keeps exactly one segment active", async () => {
		const { items } = setup();

		fireEvent.click(items()[1]);

		expect(items().filter((i) => i.getAttribute("aria-checked") === "true")).toHaveLength(1);
	});

	it("does not select a disabled segment", async () => {
		const { items, onchange } = setup({ disableDay: true });

		// The first enabled segment is active by default
		expect(items()[1]).toHaveAttribute("aria-checked", "true");

		fireEvent.click(items()[0]);

		expect(items()[0]).toHaveAttribute("aria-checked", "false");
		expect(onchange).not.toHaveBeenCalled();
	});

	it("does nothing when disabled", async () => {
		const { items, onchange } = setup({ disabled: true });

		fireEvent.click(items()[1]);

		expect(onchange).not.toHaveBeenCalled();
		expect(items()[0]).toHaveAttribute("aria-checked", "true");
	});
});
