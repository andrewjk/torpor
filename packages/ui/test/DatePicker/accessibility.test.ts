import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import DatePickerTest from "./components/DatePickerTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DatePickerTest, props);

	const trigger = within(container).getByRole("button", { name: "Start date" });
	const content = container.getElementsByClassName("torp-date-picker-content")[0] as HTMLElement;
	return { container, trigger, content };
}

export function dayButton(container: HTMLElement, day: number): HTMLButtonElement {
	// Overflow days from adjacent months are muted/aria-disabled; skip them
	const buttons = Array.from(
		container.getElementsByClassName("torp-calendar-day"),
	) as HTMLButtonElement[];
	return buttons.filter(
		(b) => b.textContent!.trim() === String(day) && b.getAttribute("aria-disabled") !== "true",
	)[0];
}

describe("DatePicker (accessibility)", () => {
	it("renders a trigger with popup semantics", async () => {
		const { trigger, content } = setup();

		expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(content).toHaveAttribute("aria-hidden", "true");
	});

	it("shows the placeholder when no date is selected", async () => {
		const { trigger } = setup();

		expect(trigger).toHaveTextContent("Pick a date");
	});

	it("marks a disabled picker's trigger as disabled", async () => {
		const { trigger } = setup({ disabled: true });

		expect(trigger).toBeDisabled();
	});
});
