import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import DatePickerFormTest from "./components/DatePickerFormTest.torp";

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

describe("DatePicker (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DatePickerFormTest, {});

		fireEvent.click(within(container).getByRole("button", { name: "Pick a date" }));
		fireEvent.click(dayButton(container, 10));

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "date");
	});

	it("validates when a date is selected", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DatePickerFormTest, {});

		const trigger = within(container).getByRole("button", { name: "Pick a date" });

		// The 15th is not allowed
		await userEvent.click(trigger);
		fireEvent.click(dayButton(container, 15));
		fireEvent.blur(trigger);
		await tick();

		expect(trigger).toHaveAttribute("aria-invalid", "true");
		expect(within(container).getByText("The 15th is unavailable")).toBeInTheDocument();

		// Another day passes
		await userEvent.click(trigger);
		fireEvent.click(dayButton(container, 10));
		await tick();

		expect(trigger).not.toHaveAttribute("aria-invalid");
		expect(within(container).queryByText("The 15th is unavailable")).toBeNull();
	});
});
