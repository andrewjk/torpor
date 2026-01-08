import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $props = $watch({ selectable: true });

		mount(container, CalendarTest, $props);

		const grid = container.querySelector(".torp-calendar");
		expect(grid).toHaveAttribute("role", "grid");
		expect(grid).toHaveAttribute("aria-label");

		const gridElement = container.querySelector(".torp-calendar-grid");
		expect(gridElement).toHaveAttribute("role", "grid");
		expect(gridElement).toHaveAttribute("aria-colcount", "7");

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

		const dayButtons = container.querySelectorAll(".torp-calendar-day button");
		dayButtons.forEach((button) => {
			expect(button).toHaveAttribute("aria-label");
			expect(button.tagName.toLowerCase()).toBe("button");
		});

		const todayButton = container.querySelector(".torp-calendar-day.today button");
		if (todayButton) {
			expect(todayButton).toHaveAttribute("aria-current", "date");
		}

		const activeDay = container.querySelector(".torp-calendar-day.active button");
		if (activeDay) {
			expect(activeDay).toHaveAttribute("aria-selected", "true");
		}

		const mutedDays = container.querySelectorAll(".torp-calendar-day.muted button");
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
