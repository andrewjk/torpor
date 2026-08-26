import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ListBoxFormTest from "./components/ListBoxFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("ListBox (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxFormTest, {});

		fireEvent.click(within(container).getByText("Green"));

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "color");
	});

	it("validates when a selection is made", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxFormTest, {});

		const listbox = within(container).getByRole("listbox");

		// Selecting red fails the schema; focus leaving validates
		fireEvent.click(within(container).getByText("Red"));
		fireEvent.focusOut(listbox);
		await tick();

		expect(within(container).getByText("Pick green")).toBeInTheDocument();
		expect(listbox).toHaveAttribute("aria-invalid", "true");

		// Selecting green passes
		fireEvent.click(within(container).getByText("Green"));
		fireEvent.focusOut(listbox);
		await tick();

		expect(within(container).queryByText("Pick green")).toBeNull();
		expect(listbox).not.toHaveAttribute("aria-invalid");
	});
});
