import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import ColorPickerComposedTest from "./components/ColorPickerComposedTest.torp";
import ColorPickerTest from "./components/ColorPickerTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function swatches(container: HTMLElement): HTMLButtonElement[] {
	return [...container.querySelectorAll<HTMLButtonElement>(".torp-color-palette-swatch")];
}

describe("ColorPicker", () => {
	it("renders the default palette as a radio group", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, {});

		const group = within(container).getByRole("radiogroup");
		expect(within(group).getAllByRole("radio").length).toBeGreaterThan(20);
	});

	it("selects and deselects swatches", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, { onchange });

		const [first] = swatches(container);
		fireEvent.click(first);
		await tick();

		expect(first).toHaveAttribute("aria-checked", "true");
		expect(onchange).toHaveBeenLastCalledWith(first.getAttribute("data-color")!.toLowerCase());

		fireEvent.click(first);
		await tick();
		expect(first).toHaveAttribute("aria-checked", "false");
		expect(onchange).toHaveBeenLastCalledWith(undefined);
	});

	it("keeps the bound value in sync", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, {
			value: "#ff0000",
			colors: ["#FFFFFF", "#FF0000", "#00FF88"],
		});

		const selected = container.querySelector('[data-selected="selected"]')!;
		expect(selected).toHaveAttribute("data-color", "#FF0000");
		// Case-insensitive match against the bound value
		expect(within(container).getByRole("radio", { checked: true })).toBe(selected);
	});

	it("hex input commits valid values and reverts invalid ones", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, { showInput: true, onchange });

		const input = container.querySelector<HTMLInputElement>(".torp-color-picker-input")!;
		expect(input).not.toBeNull();

		fireEvent.input(input, { target: { value: "#00ff88" } });
		fireEvent.blur(input);
		await tick();

		expect(onchange).toHaveBeenCalledWith("#00ff88");

		fireEvent.input(input, { target: { value: "not-a-color" } });
		fireEvent.blur(input);
		await tick();

		// Reverted to the last committed value
		expect(input.value).toBe("#00ff88");
		expect(onchange).toHaveBeenLastCalledWith("#00ff88");
	});

	it("hex input accepts 3-digit shorthand", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, { showInput: true, onchange });

		const input = container.querySelector<HTMLInputElement>(".torp-color-picker-input")!;
		fireEvent.input(input, { target: { value: "f80" } });
		fireEvent.blur(input);
		await tick();

		expect(onchange).toHaveBeenCalledWith("#ff8800");
	});

	it("arrow keys move selection through the palette", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, {
			colors: ["#111111", "#222222", "#333333"],
		});

		const buttons = swatches(container);
		expect(buttons.length).toBe(3);

		buttons[0].focus();
		fireEvent(buttons[0], new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
		await tick();

		expect(document.activeElement).toBe(buttons[1]);
		expect(buttons[1]).toHaveAttribute("aria-checked", "true");
	});
});

describe("ColorPicker (subcomponents)", () => {
	it("renders the palette and input automatically with no children", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerTest as any, { showInput: true });

		expect(container.querySelector(".torp-color-picker-palette")).toBeInTheDocument();
		expect(container.querySelector(".torp-color-picker-input")).toBeInTheDocument();
	});

	it("renders an explicitly composed input with its own props", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColorPickerComposedTest as any, {
			showInput: true,
			inputClass: "custom-input",
			colors: ["#FFFFFF", "#00FF88"],
			onchange,
		});

		const input = container.querySelector<HTMLInputElement>(".torp-color-picker-input")!;
		expect(input).toHaveClass("custom-input");
		expect(container.querySelector(".custom-palette")).toBeInTheDocument();

		// Committing through the composed input updates the shared value
		fireEvent.input(input, { target: { value: "#00ff88" } });
		fireEvent.blur(input);
		await tick();

		expect(onchange).toHaveBeenCalledWith("#00ff88");
		expect(input.value).toBe("#00ff88");

		// The composed palette reflects the input's value
		const selected = container.querySelector('[data-selected="selected"]')!;
		expect(selected).toHaveAttribute("data-color", "#00FF88");
	});
});
