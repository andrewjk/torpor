import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Handles month boundaries (31st to 1st)", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, value: new Date(2025, 0, 31) });

		const grid = container.querySelector(".torp-calendar-grid") as HTMLElement;
		assert(grid, "Grid not found");
		grid.focus();

		await userEvent.keyboard("{ArrowRight}");
		const activeDay = container.querySelector("button.torp-calendar-day.active");
		assert(activeDay, "Active day not set");
		expect(activeDay.textContent.trim()).toBe("1");

		await userEvent.keyboard("{End}");
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "February 2025")).toBeInTheDocument();
	});

	it("Handles year boundaries", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, value: new Date(2025, 11, 31) });

		const grid = container.querySelector(".torp-calendar-grid") as HTMLElement;
		assert(grid, "Grid not found");
		grid.focus();

		await userEvent.keyboard("{End}");
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "January 2026")).toBeInTheDocument();
	});

	it("Displays muted days from prev/next month", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, value: new Date(2025, 8, 1) });

		const mutedDays = container.querySelectorAll(".torp-calendar-day.muted");
		expect(mutedDays.length).toBeGreaterThan(0);
	});
});
