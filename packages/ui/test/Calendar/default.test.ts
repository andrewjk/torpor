import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import CalendarTest from "./components/CalendarTest.torp";

describe("Calendar", () => {
	it("Default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CalendarTest, { selectable: true, value: new Date(2025, 8, 15) });

		expect(queryByText(container, "September 2025")).toBeInTheDocument();

		expect(queryByText(container, "15")).toBeInTheDocument();
		expect(queryByText(container, "15")!.parentElement!.parentElement).toHaveClass("active");
	});
});
