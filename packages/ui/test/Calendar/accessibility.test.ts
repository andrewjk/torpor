import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $props = $watch({ selectable: true });

		mount(container, CalendarTest, $props);

		// The calendar root is a plain container -- the grid role is on the
		// grid itself (nested grids are not valid)
		const root = container.querySelector(".torp-calendar");
		expect(root).not.toHaveAttribute("role");

		const grid = container.querySelector(".torp-calendar-grid");
		expect(grid).toHaveAttribute("role", "grid");
		expect(grid).toHaveAttribute("aria-label");
		expect(grid).toHaveAttribute("aria-colcount", "7");

		$props.selectable = false;
		expect(grid).toHaveAttribute("aria-readonly", "true");

		$props.selectable = true;
		expect(grid).not.toHaveAttribute("aria-readonly");

		const headerRow = container.querySelector(".torp-calendar-grid-header");
		expect(headerRow).toHaveAttribute("role", "row");

		const dayHeaders = container.querySelectorAll(".torp-calendar-day-header");
		dayHeaders.forEach((header) => {
			expect(header).toHaveAttribute("role", "columnheader");
			expect(header).toHaveAttribute("aria-label");
			expect(header).toHaveAttribute("abbr");
		});

		// The days are wrapped in row/gridcell elements so screen readers can
		// navigate the grid -- one row per week, one gridcell per day
		const rows = grid.querySelectorAll('[role="row"]');
		expect(rows.length).toBeGreaterThan(0);

		const gridcells = grid.querySelectorAll('[role="gridcell"]');
		expect(gridcells.length).toBeGreaterThan(0);
		expect(gridcells.length % 7).toBe(0);

		gridcells.forEach((cell) => {
			expect(cell.children.length).toBeGreaterThan(0);
		});

		const dayButtons = container.querySelectorAll("button.torp-calendar-day");
		expect(dayButtons.length).toBe(gridcells.length);
		dayButtons.forEach((button) => {
			expect(button).toHaveAttribute("aria-label");
		});

		const todayButton = container.querySelector("button.torp-calendar-day.today");
		expect(todayButton).not.toBeNull();
		expect(todayButton).toHaveAttribute("aria-current", "date");

		// aria-selected is only valid on a gridcell, so it lives there rather
		// than on the day's button
		const activeButton = container.querySelector("button.torp-calendar-day.active");
		expect(activeButton).not.toBeNull();
		expect(activeButton).not.toHaveAttribute("aria-selected");

		const activeCell = activeButton!.closest('[role="gridcell"]');
		expect(activeCell).not.toBeNull();
		expect(activeCell).toHaveAttribute("aria-selected", "true");

		const mutedDays = container.querySelectorAll("button.torp-calendar-day.muted");
		expect(mutedDays.length).toBeGreaterThan(0);
		mutedDays.forEach((button) => {
			expect(button).toHaveAttribute("aria-disabled", "true");
		});

		const header = container.querySelector(".torp-calendar-header");
		expect(header).toHaveAttribute("aria-live", "polite");
		expect(header).toHaveAttribute("aria-atomic", "true");

		const triggers = container.querySelectorAll(".torp-calendar-trigger");
		triggers.forEach((trigger) => {
			expect(trigger).toHaveAttribute("aria-label");
		});
	});
});
