import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import DatePickerComposedTest from "./components/DatePickerComposedTest.torp";
import DatePickerTest from "./components/DatePickerTest.torp";
import { dayButton } from "./accessibility.test";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DatePickerTest, { ...props, onchange });

	const trigger = within(container).getByRole("button", { name: "Start date" });
	const content = container.getElementsByClassName("torp-date-picker-content")[0] as HTMLElement;
	return { container, trigger, content, onchange };
}

async function open(container: HTMLElement, trigger: HTMLElement) {
	fireEvent.click(trigger);
	await new Promise((r) => setTimeout(r, 5));
	return container.getElementsByClassName("torp-calendar-grid")[0] as HTMLElement;
}

describe("DatePicker", () => {
	it("opens a calendar popout on click", async () => {
		const { container, trigger, content } = setup();

		expect(content).toHaveClass("hidden");

		const grid = await open(container, trigger);

		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(content).not.toHaveClass("hidden");

		// The grid redirects focus to the active day
		expect(grid).toBeInTheDocument();
		expect(content.contains(document.activeElement)).toBe(true);
	});

	it("selects a date, closes the popout and raises onchange", async () => {
		const { container, trigger, content, onchange } = setup();

		await open(document.body, trigger);
		fireEvent.click(dayButton(container, 15));
		await new Promise((r) => setTimeout(r, 5));

		const now = new Date();
		const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;

		expect(onchange).toHaveBeenCalledTimes(1);
		expect(onchange.mock.calls[0][0].getDate()).toBe(15);
		expect(within(container).getByRole("button", { name: "Start date" })).toHaveTextContent(iso);
		expect(content).toHaveClass("hidden");
	});

	it("closes on escape and returns focus to the trigger", async () => {
		const { container, trigger, content } = setup();

		const grid = await open(container, trigger);

		fireEvent.keyDown(grid, { key: "Escape" });
		await new Promise((r) => setTimeout(r, 5));

		expect(content).toHaveClass("hidden");
		expect(trigger).toHaveFocus();
	});

	it("closes when clicking outside", async () => {
		const { trigger, content } = setup();

		await open(document.body, trigger);
		expect(content).not.toHaveClass("hidden");

		fireEvent.mouseDown(document.body);
		fireEvent.click(document.body);

		expect(content).toHaveClass("hidden");
	});

	it("updates the hidden form input with the selected date", async () => {
		const { container, trigger } = setup({ name: "startDate" });

		let hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
		expect(hidden.name).toBe("startDate");
		expect(hidden.value).toBe("");

		await open(document.body, trigger);
		fireEvent.click(dayButton(container, 15));

		hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
		const now = new Date();
		expect(hidden.value).toBe(
			`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`,
		);
	});
});

describe("DatePicker (subcomponents)", () => {
	function setupComposed(props: Record<string, unknown> = {}) {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DatePickerComposedTest, { ...props, onchange });

		const trigger = within(container).getByRole("button", { name: "Start date" });
		const content = container.getElementsByClassName("torp-date-picker-content")[0] as HTMLElement;
		return { container, trigger, content, onchange };
	}

	it("renders the trigger and content automatically with no children", async () => {
		const { container } = setup({});

		expect(container.querySelector(".torp-date-picker-trigger")).toBeInTheDocument();
		expect(container.querySelector(".torp-date-picker-content")).toHaveClass("hidden");
	});

	it("renders explicitly composed trigger and content with their own props", async () => {
		const { trigger, content } = setupComposed({
			triggerClass: "custom-trigger",
			contentClass: "custom-content",
		});

		expect(trigger).toHaveClass("torp-date-picker-trigger", "custom-trigger");
		expect(content).toHaveClass("torp-date-picker-content", "custom-content");
	});

	it("selects a date through the composed parts", async () => {
		const { container, trigger, content, onchange } = setupComposed({});

		fireEvent.click(trigger);
		await new Promise((r) => setTimeout(r, 5));
		expect(content).not.toHaveClass("hidden");

		fireEvent.click(dayButton(container, 15));
		await new Promise((r) => setTimeout(r, 5));

		expect(onchange).toHaveBeenCalledTimes(1);
		expect(content).toHaveClass("hidden");
	});
});
