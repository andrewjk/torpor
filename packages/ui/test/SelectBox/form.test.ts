import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SelectBoxFormTest from "./components/SelectBoxFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("SelectBox (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxFormTest, {});

		await userEvent.click(within(container).getByRole("combobox"));
		fireEvent.click(within(container).getByText("Item 1"));

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "picked");
	});

	it("validates when an item is selected", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxFormTest, {});

		const trigger = within(container).getByRole("combobox");

		// Selecting item 1 fails the schema
		await userEvent.click(trigger);
		fireEvent.click(within(container).getByText("Item 1"));
		fireEvent.blur(trigger);
		await tick();

		expect(trigger).toHaveAttribute("aria-invalid", "true");
		expect(within(container).getByText("Pick item 2")).toBeInTheDocument();

		// Selecting item 2 passes
		await userEvent.click(trigger);
		fireEvent.click(within(container).getAllByText("Item 2")[0]);
		await tick();

		expect(trigger).not.toHaveAttribute("aria-invalid");
		expect(within(container).queryByText("Pick item 2")).toBeNull();
	});
});
