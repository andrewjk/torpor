import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TimePickerFormTest from "./components/TimePickerFormTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

describe("TimePicker (in forms)", () => {
	it("submits its canonical value under the Field's name", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TimePickerFormTest as any, { value: "07:45" });

		expect(container.querySelector('input[type="hidden"][name="alarm"]')).toHaveAttribute(
			"value",
			"07:45",
		);

		// Editing through the picker writes back into the form data
		fireEvent.input(within(container).getByRole("spinbutton", { name: /hour/i }), {
			target: { value: "0" },
		});
		fireEvent.input(within(container).getByRole("spinbutton", { name: /hour/i }), {
			target: { value: "06" },
		});
		await tick();

		expect(container.querySelector('input[type="hidden"][name="alarm"]')).toHaveAttribute(
			"value",
			"06:45",
		);
	});
});
