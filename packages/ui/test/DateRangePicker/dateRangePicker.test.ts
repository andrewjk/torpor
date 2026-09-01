import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import DateRangePickerTest from "./components/DateRangePickerTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DateRangePickerTest, { ...props, onchange });
	return {
		container,
		onchange,
		trigger: () => within(container).getByRole("button", { name: "Select dates" }),
		open: async () => {
			fireEvent.click(within(container).getByRole("button", { name: "Select dates" }));
			await new Promise((r) => setTimeout(r, 5));
		},
		day: (dayNumber: number) => {
			const now = new Date();
			const date = new Date(now.getFullYear(), now.getMonth(), dayNumber);
			const label = new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}).format(date);
			return within(container).getByRole("button", { name: label });
		},
	};
}

describe("DateRangePicker", () => {
	it("shows the placeholder when empty", async () => {
		const { trigger } = setup();

		expect(trigger()).toHaveTextContent("Select dates");
	});

	it("shows the selected range", async () => {
		const { trigger } = setup({
			value: {
				start: new Date(2026, 0, 10),
				end: new Date(2026, 0, 20),
			},
		});

		expect(trigger()).toHaveTextContent("2026-01-10 – 2026-01-20");
	});

	it("selects a range with two clicks", async () => {
		const { open, day, onchange, trigger } = setup();

		await open();
		fireEvent.click(day(10));
		fireEvent.click(day(20));

		expect(onchange).toHaveBeenCalledTimes(1);
		const range = onchange.mock.calls[0][0];
		const now = new Date();
		expect(range.start.getFullYear()).toBe(now.getFullYear());
		expect(range.start.getMonth()).toBe(now.getMonth());
		expect(range.start.getDate()).toBe(10);
		expect(range.end.getDate()).toBe(20);
		expect(trigger().textContent).toContain(`–`);
	});

	it("highlights the range between the two dates", async () => {
		const { container, open, day } = setup();

		await open();
		fireEvent.click(day(10));
		fireEvent.click(day(14));

		const start = container.querySelector('[data-range="start"]');
		const end = container.querySelector('[data-range="end"]');
		const inside = container.querySelectorAll('[data-range="inside"]');

		expect(start).not.toBeNull();
		expect(end).not.toBeNull();
		expect(inside).toHaveLength(3);

		// aria-selected is only valid on a gridcell, so it lives there rather
		// than on the day's button -- the last clicked day (the range's end)
		// is the active one
		expect(start).not.toHaveAttribute("aria-selected");
		expect(end).not.toHaveAttribute("aria-selected");
		expect(end!.closest('[role="gridcell"]')).toHaveAttribute("aria-selected", "true");
	});

	it("starts a new range when clicking before the start", async () => {
		const { open, day, onchange } = setup();

		await open();
		fireEvent.click(day(10));
		fireEvent.click(day(5));
		// The range is still incomplete, so onchange hasn't fired
		expect(onchange).not.toHaveBeenCalled();

		fireEvent.click(day(8));

		const range = onchange.mock.calls[0][0];
		expect(range.start.getDate()).toBe(5);
		expect(range.end.getDate()).toBe(8);
	});

	it("restarts the range with a third click", async () => {
		const { container, open, day, onchange } = setup();

		await open();
		fireEvent.click(day(10));
		fireEvent.click(day(20));
		expect(onchange).toHaveBeenCalledTimes(1);

		// Re-open (it closed on completion) and start again
		await open();
		fireEvent.click(day(3));

		expect(onchange).toHaveBeenCalledTimes(1);
		const start = container.querySelector('[data-range="start"]') as HTMLElement;
		expect(start).toHaveTextContent("3");
	});
});
