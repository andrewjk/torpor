import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import ToggleTest from "./components/ToggleTest.torp";

describe("Toggle", () => {
	it("toggles on click and raises onchange", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, { onchange });

		const toggle = within(container).getByRole("switch");

		fireEvent.click(toggle);
		expect(toggle).toBeChecked();

		fireEvent.click(toggle);
		expect(toggle).not.toBeChecked();

		expect(onchange).toHaveBeenCalledTimes(2);
	});

	it("does not toggle when disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, { disabled: true, checked: true });

		const toggle = within(container).getByRole("switch") as HTMLInputElement;
		expect(toggle.disabled).toBe(true);
		expect(toggle).toBeChecked();
	});
});
