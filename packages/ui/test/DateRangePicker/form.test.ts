import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import DateRangePickerFormTest from "./components/DateRangePickerFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

function dayButton(container: HTMLElement, day: number) {
	const now = new Date();
	const date = new Date(now.getFullYear(), now.getMonth(), day);
	const label = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
	return within(container).getByRole("button", { name: label });
}

describe("DateRangePicker (in forms)", () => {
	it("uses the Field's names for its form values", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DateRangePickerFormTest, {});

		fireEvent.click(within(container).getByRole("button", { name: "Pick dates" }));
		fireEvent.click(dayButton(container, 10));
		fireEvent.click(dayButton(container, 20));

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "dates-start");
	});

	it("validates when a range is completed", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DateRangePickerFormTest, {});

		const trigger = within(container).getByRole("button", { name: "Pick dates" });

		// A range ending on the 28th fails
		fireEvent.click(trigger);
		fireEvent.click(dayButton(container, 25));
		fireEvent.click(dayButton(container, 28));
		fireEvent.blur(trigger);
		await tick();

		expect(trigger).toHaveAttribute("aria-invalid", "true");
		expect(within(container).getByText("Stays must end by the 20th")).toBeInTheDocument();

		// A range ending on the 12th passes
		fireEvent.click(trigger);
		fireEvent.click(dayButton(container, 5));
		fireEvent.click(dayButton(container, 12));
		await tick();

		expect(trigger).not.toHaveAttribute("aria-invalid");
		expect(within(container).queryByText("Stays must end by the 20th")).toBeNull();
	});
});
