import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("Empty ComboBox with no items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		const items = container.querySelectorAll('[role="option"]');
		expect(items.length).toBe(3);
	});

	it("All items filtered out", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("xyz");

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list).toBeInTheDocument();
		expect(list).not.toHaveAttribute("aria-hidden");
	});

	it("Rapid state changes don't cause errors", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: null as string | null,
			visible: false,
		});

		mount(container, ComboBoxSingle, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		$state.visible = true;
		$state.visible = false;
		$state.visible = true;

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list).not.toHaveAttribute("aria-hidden");
	});

	it("Unmounting while open doesn't cause errors", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list).not.toHaveAttribute("aria-hidden");

		container.remove();
	});

	// TODO:
	it.skip("Rapid value updates", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: null as string | null,
		});

		mount(container, ComboBoxSingle, $state);

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		$state.value = "Item 1";
		$state.value = "Item 2";
		$state.value = "Item 3";

		expect(input.value).toBe("Item 3");
	});

	it("Undefined value doesn't crash", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: undefined as string | undefined,
		});

		mount(container, ComboBoxSingle, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		expect(button.textContent.trim()).toBe("");
	});

	it("Null value doesn't crash", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: null as string | null,
		});

		mount(container, ComboBoxSingle, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		expect(button.textContent.trim()).toBe("");
	});

	it("Empty string value doesn't crash", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: "" as string,
		});

		mount(container, ComboBoxSingle, $state);

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		expect(button.textContent.trim()).toBe("");
	});

	it("Value not in items still works", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		let $state = $watch({
			value: "Invalid Value",
		});

		mount(container, ComboBoxSingle, $state);

		const input = container.getElementsByTagName("input")[0];
		assert(input, "button not found");

		expect(input.value).toBe("Invalid Value");

		await userEvent.click(input);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 1")).toHaveAttribute("aria-selected", "false");
	});

	it("Multiple rapid clicks don't cause issues", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(button);
		await userEvent.click(button);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list).not.toHaveAttribute("aria-hidden");
	});
});
