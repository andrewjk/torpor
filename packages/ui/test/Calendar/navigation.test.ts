import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Previous month navigation", async () => {
		const onchangedate = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, {
			selectable: true,
			onchangedate,
			value: new Date(2025, 8, 15),
		});

		const prevButton = container.querySelector('[data-type="previous"]');
		await userEvent.click(prevButton!);

		expect(queryByText(container, "August 2025")).toBeInTheDocument();
		expect(onchangedate).toHaveBeenCalled();
	});

	it("Next month navigation", async () => {
		const onchangedate = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, {
			selectable: true,
			onchangedate,
			value: new Date(2025, 8, 15),
		});

		const nextButton = container.querySelector('[data-type="next"]');
		await userEvent.click(nextButton!);

		expect(queryByText(container, "October 2025")).toBeInTheDocument();
		expect(onchangedate).toHaveBeenCalled();
	});
});
