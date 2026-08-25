import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import NumberInputTest from "./components/NumberInputTest.torp";

describe("NumberInput (accessibility)", () => {
	it("is a spinbutton with an accessible name", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputTest, { ariaLabel: "Quantity" });

		expect(within(container).getByRole("spinbutton", { name: "Quantity" })).toBeInTheDocument();
	});

	it("reports value attributes when provided", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputTest, { value: 4, min: 1, max: 9 });

		const input = within(container).getByRole("spinbutton");
		expect(input).toHaveAttribute("aria-valuemin", "1");
		expect(input).toHaveAttribute("aria-valuemax", "9");
		expect(input).toHaveAttribute("aria-valuenow", "4");
	});

	it("omits value attributes when they are not provided", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputTest, {});

		const input = within(container).getByRole("spinbutton");
		expect(input).not.toHaveAttribute("aria-valuemin");
		expect(input).not.toHaveAttribute("aria-valuemax");
		expect(input).not.toHaveAttribute("aria-valuenow");
	});

	it("marks a disabled input as disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputTest, { disabled: true });

		expect(within(container).getByRole("spinbutton")).toHaveAttribute("aria-disabled", "true");
	});
});
