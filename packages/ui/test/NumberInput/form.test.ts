import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import NumberInputFormTest from "./components/NumberInputFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("NumberInput (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputFormTest, {});

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "amount");
	});

	it("validates on blur and shows a message when the value is too small", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputFormTest, {});

		const input = within(container).getByRole("spinbutton");

		// Value is 1, below the Field minimum of 5; blurring validates
		fireEvent.blur(input);
		await tick();

		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAttribute("data-valid", "invalid");
		expect(within(container).getByText("Amount must be at least 5")).toBeInTheDocument();

		// Stepping past the minimum revalidates and clears the error
		for (let i = 0; i < 4; i++) {
			fireEvent.keyDown(input, { key: "ArrowUp" });
		}
		await tick();

		expect(input).not.toHaveAttribute("aria-invalid");
		expect(within(container).queryByText("Amount must be at least 5")).toBeNull();
	});
});
