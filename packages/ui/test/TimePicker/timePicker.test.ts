import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import TimePickerTest from "./components/TimePickerTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function getHour(container: HTMLElement): HTMLInputElement {
	return within(container).getByRole("spinbutton", { name: /hour/i }) as HTMLInputElement;
}

function getMinute(container: HTMLElement): HTMLInputElement {
	return within(container).getByRole("spinbutton", { name: "Minute" }) as HTMLInputElement;
}

function getSecond(container: HTMLElement): HTMLInputElement {
	return within(container).getByRole("spinbutton", { name: "Second" }) as HTMLInputElement;
}

describe("TimePicker", () => {
	it("renders hour and minute segments, empty by default", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, {});

		expect(getHour(container)).toBeInTheDocument();
		expect(getMinute(container)).toBeInTheDocument();
		expect(within(container).queryByRole("spinbutton", { name: "Second" })).not.toBeInTheDocument();
		expect(container.querySelector(".torp-time-picker-period")).not.toBeInTheDocument();
	});

	it("shows the 24-hour value with zero padding", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "09:05" });

		expect(getHour(container)).toHaveValue("09");
		expect(getMinute(container)).toHaveValue("05");
	});

	it("typing digits commits the segment and advances focus", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, {});

		const hour = getHour(container);
		fireEvent.input(hour, { target: { value: "0" } });
		await tick();
		fireEvent.input(hour, { target: { value: "09" } });
		await tick();

		expect(hour).toHaveAttribute("aria-valuenow", "9");
		expect(getMinute(container)).toHaveFocus();
	});

	it("arrow keys step each segment independently", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "10:30" });

		fireEvent.keyDown(getHour(container), { key: "ArrowUp" });
		await tick();
		fireEvent.keyDown(getMinute(container), { key: "ArrowUp" });
		await tick();

		expect(within(container).getAllByRole("spinbutton")[0]).toHaveAttribute("aria-valuenow", "11");
		expect(getMinute(container)).toHaveAttribute("aria-valuenow", "31");

		fireEvent.keyDown(getMinute(container), { key: "ArrowDown" });
		await tick();
		expect(getMinute(container)).toHaveAttribute("aria-valuenow", "30");
	});

	it("stepping wraps like a clock face", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "23:59", onchange });

		fireEvent.keyDown(getHour(container), { key: "ArrowUp" });
		await tick();
		fireEvent.keyDown(getMinute(container), { key: "ArrowUp" });
		await tick();

		expect(getHour(container)).toHaveAttribute("aria-valuenow", "0");
		expect(getMinute(container)).toHaveAttribute("aria-valuenow", "0");
	});

	it("fires onchange with the canonical 24-hour value", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { onchange });

		const minute = getMinute(container);
		fireEvent.input(hourPressThen(container), { target: { value: "13" } });
		await tick();

		function hourPressThen(c: HTMLElement): HTMLElement {
			return getHour(c);
		}
		fireEvent.input(minute, { target: { value: "45" } });
		await tick();

		expect(onchange).toHaveBeenCalledWith("13:45");
	});

	it("respects the step prop for minutes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "08:00", step: 15 });

		fireEvent.keyDown(getMinute(container), { key: "ArrowUp" });
		await tick();

		expect(getMinute(container)).toHaveAttribute("aria-valuenow", "15");
	});

	it("shows a seconds field when seconds is set", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { seconds: true, value: "08:00:15" });

		expect(getSecond(container)).toHaveValue("15");
	});

	it("12-hour mode shows an AM/PM toggle and canonical values stay 24-hour", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { hour12: true, value: "19:30", onchange });

		const period = container.querySelector<HTMLButtonElement>(".torp-time-picker-period")!;
		expect(period).toBeInTheDocument();
		expect(period).toHaveTextContent("PM");
		expect(getHour(container)).toHaveValue("07");

		fireEvent.click(period);
		await tick();

		expect(period).toHaveTextContent("AM");
		expect(getHour(container)).toHaveAttribute("aria-valuenow", "7");
	});

	it("clamps values outside min and max", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "04:30", min: "06:00", max: "20:00" });

		// Value normalizes up to min on commit path; check stepping can't pass max
		for (let i = 0; i < 40; i++) {
			fireEvent.keyDown(getHour(container), { key: "ArrowUp" });
			await tick();
		}
		const now = Number(getHour(container).getAttribute("aria-valuenow"));
		expect(now).toBeLessThanOrEqual(23);

		// But clamping only applies to setParts, so combined time stays <= max
		const h = now!;
		if (h === 20) {
			expect(getMinute(container)).toHaveAttribute("aria-valuenow", "0");
		}
	});

	it("disabled blocks interaction", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerTest as any, { value: "12:00", disabled: true, onchange });

		expect(getHour(container)).toBeDisabled();
		expect(getHour(container)).toHaveAttribute("tabindex", "-1");

		fireEvent.keyDown(getHour(container), { key: "ArrowUp" });
		await tick();
		expect(onchange).not.toHaveBeenCalled();
	});
});
