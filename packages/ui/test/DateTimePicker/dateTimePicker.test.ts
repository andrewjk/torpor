import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import { dayButton } from "../DatePicker/accessibility.test";
import DateTimePickerTest from "./components/DateTimePickerTest.torp";

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

function setup(props: Record<string, any> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DateTimePickerTest as any, { ...props, onchange });
	const trigger = within(container).getByRole("button", { name: "Start date and time" });
	const content = container.querySelector<HTMLElement>(".torp-date-time-picker-content")!;
	return { container, trigger, content, onchange };
}

describe("DateTimePicker", () => {
	it("opens a calendar and time field in one popout", async () => {
		const { trigger, content } = setup();
		expect(content).toHaveClass("hidden");

		fireEvent.click(trigger);
		await tick();

		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(content).not.toHaveClass("hidden");
		expect(content.querySelector(".torp-calendar-grid")).toBeInTheDocument();
		expect(content.querySelector(".torp-time-picker")).toBeInTheDocument();
	});

	it("combines the selected date with the chosen time", async () => {
		const { container, trigger, onchange } = setup();
		fireEvent.click(trigger);
		await tick();

		fireEvent.click(dayButton(container, 15));
		await tick();

		const value = onchange.mock.lastCall![0] as Date;
		expect(value.getDate()).toBe(15);
		expect(value.getHours()).toBe(9);
		expect(value.getMinutes()).toBe(0);

		const hour = container.querySelector<HTMLInputElement>(".torp-time-picker input")!;
		fireEvent.input(hour, { target: { value: "14" } });
		fireEvent.blur(hour);
		await tick();

		const updated = onchange.mock.lastCall![0] as Date;
		expect(updated.getDate()).toBe(15);
		expect(updated.getHours()).toBe(14);
	});

	it("uses the date and time in its form value", async () => {
		const { container, trigger } = setup();
		fireEvent.click(trigger);
		await tick();
		fireEvent.click(dayButton(container, 15));
		await tick();

		const hiddenInputs = container.querySelectorAll<HTMLInputElement>(
			'input[type="hidden"][name="starts_at"]',
		);
		expect(hiddenInputs).toHaveLength(1);
		const hidden = hiddenInputs[0];
		const now = new Date();
		const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15T`;
		expect(hidden.value).toBe(`${prefix}09:00`);
	});

	it("closes on Escape", async () => {
		const { trigger, content } = setup();
		fireEvent.click(trigger);
		await tick();

		fireEvent.keyDown(content, { key: "Escape" });
		await tick();
		expect(content).toHaveClass("hidden");
		expect(trigger).toHaveFocus();
	});
});
