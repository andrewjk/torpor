import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SelectBoxMultipleTest from "./components/SelectBoxMultipleTest.torp";

function setup() {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SelectBoxMultipleTest);

	const trigger = within(container).getByRole("combobox", { name: "Tags" });

	// Open the popout so its contents enter the accessibility tree
	fireEvent.click(trigger);
	const listbox = within(container).getByRole("listbox", { name: "Tags" });
	return { container, trigger, listbox };
}

describe("SelectBox with multiple", () => {
	it("shows the placeholder when nothing is selected", async () => {
		const { trigger } = setup();

		expect(trigger).toHaveTextContent("Pick tags");
	});

	it("collects multiple selections into one form field", async () => {
		const { container, trigger, listbox } = setup();

		fireEvent.click(within(listbox).getByText("Red"));
		fireEvent.click(within(listbox).getByText("Blue"));

		const form = container.querySelector("#multi-form") as HTMLFormElement;
		expect(form.querySelectorAll('input[type="hidden"][name="tags"]')).toHaveLength(2);
		const values = new FormData(form).getAll("tags");
		expect(values).toContain("red");
		expect(values).toContain("blue");

		expect(trigger).toHaveTextContent("blue, red");
	});

	it("keeps the popout open while toggling selections", async () => {
		const { container, listbox } = setup();

		fireEvent.click(within(listbox).getByText("Red"));
		fireEvent.click(within(listbox).getByText("Green"));

		const content = container.getElementsByClassName("torp-select-box-content")[0];
		expect(content).not.toHaveClass("hidden");
	});
});
