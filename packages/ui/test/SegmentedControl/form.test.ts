import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SegmentedControlFormTest from "./components/SegmentedControlFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("SegmentedControl (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SegmentedControlFormTest, {});

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "view");
	});

	it("validates on blur and when a segment is selected", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SegmentedControlFormTest, {});

		const items = within(container).getAllByRole("radio");

		// Selecting "day" fails the schema; blurring validates
		fireEvent.click(items[0]);
		fireEvent.focusOut(items[0]);
		await tick();

		expect(within(container).getByText("Pick the month view")).toBeInTheDocument();

		// Selecting "month" passes
		fireEvent.click(items[2]);
		await tick();

		expect(within(container).queryByText("Pick the month view")).toBeNull();
	});
});
