import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("startOfWeek changes first day", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $props = $watch({
			selectable: true,
			startOfWeek: 1,
			value: new Date(2025, 8, 1),
		});

		mount(container, CalendarTest, $props);
		let firstDay = container.querySelector(".torp-calendar-day:not(.muted)");
		assert(firstDay, "First day not found");
		expect(firstDay.textContent.trim()).toBe("1");

		$props.startOfWeek = 0;

		firstDay = container.querySelector(".torp-calendar-day:not(.muted)");
		assert(firstDay, "First day not found");
		expect(firstDay.textContent.trim()).toBe("1");
	});
});
