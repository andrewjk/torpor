import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it, vi } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Arrow key navigation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, value: new Date(2026, 0, 15) });

		const grid = container.querySelector(".torp-calendar-grid") as HTMLDivElement;
		assert(grid, "Grid not found");
		grid.focus();

		await userEvent.keyboard("{ArrowRight}");
		let newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("16");

		await userEvent.keyboard("{ArrowLeft}");
		newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("15");

		await userEvent.keyboard("{ArrowUp}");
		newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("8");

		await userEvent.keyboard("{ArrowDown}");
		newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("15");

		await userEvent.keyboard("{Home}");
		newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("12");

		await userEvent.keyboard("{End}");
		newActive = container.querySelector("button.torp-calendar-day.active");
		assert(newActive, "New active day not set");
		expect(newActive.textContent.trim()).toBe("18");

		await userEvent.keyboard("{PageUp}");
		expect(queryByText(container, "December 2025")).toBeInTheDocument();

		await userEvent.keyboard("{PageDown}");
		expect(queryByText(container, "January 2026")).toBeInTheDocument();
	});

	it("Enter selects date", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, onchange });

		const grid = container.querySelector(".torp-calendar-grid") as HTMLDivElement;
		assert(grid, "Grid not found");
		grid.focus();

		await userEvent.keyboard("{Enter}");
		expect(onchange).toHaveBeenCalled();
	});

	it("Escape calls onclose", async () => {
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, onclose });

		const grid = container.querySelector(".torp-calendar-grid") as HTMLDivElement;
		assert(grid, "Grid not found");
		grid.focus();

		await userEvent.keyboard("{Escape}");
		expect(onclose).toHaveBeenCalled();
	});
});
