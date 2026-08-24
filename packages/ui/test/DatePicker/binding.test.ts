import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import DatePickerBindingTest from "./components/DatePickerBindingTest.torp";
import { dayButton } from "./accessibility.test";

describe("DatePicker (binding)", () => {
	it("writes the selected date back to the bound state", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DatePickerBindingTest);

		expect(within(container).getByText("none")).toBeInTheDocument();

		const trigger = within(container).getByRole("button", { name: "Bound date" });
		fireEvent.click(trigger);
		await new Promise((r) => setTimeout(r, 5));

		fireEvent.click(dayButton(container, 10));
		await new Promise((r) => setTimeout(r, 5));

		const now = new Date();
		const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;
		expect(within(container).getByTestId("bound-value")).toHaveTextContent(iso);
	});
});
