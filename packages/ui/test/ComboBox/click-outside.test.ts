import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vite-plus/test";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("Clicking outside closes ComboBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(document.body);

		expect(list?.parentElement).toHaveAttribute("aria-hidden", "true");
	});

	it("Clicking inside doesn't close ComboBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(getByText(container, "Item 1"));

		expect(input.value).toBe("Item 1");
		expect(list?.parentElement).toHaveAttribute("aria-hidden", "true");
	});

	it("Click outside preserves value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: "Item 1" });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		expect(input.value).toBe("Item 1");

		await userEvent.click(input);
		await userEvent.click(document.body);

		expect(input.value).toBe("Item 1");
	});

	it("Clicking input after opening doesn't close", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(input);

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");
	});

	it("Clicking element outside container closes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		const outsideElement = document.createElement("div");
		document.body.appendChild(outsideElement);

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(outsideElement);

		expect(list?.parentElement).toHaveAttribute("aria-hidden", "true");

		outsideElement.remove();
	});

	it("Clicking on container but outside ComboBox closes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const wrapper = document.createElement("div");
		document.body.appendChild(wrapper);

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(wrapper);

		expect(list?.parentElement).toHaveAttribute("aria-hidden", "true");

		wrapper.remove();
	});

	it("Multiple clicks outside don't cause issues", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list?.parentElement).not.toHaveAttribute("aria-hidden");

		await userEvent.click(document.body);
		await userEvent.click(document.body);
		await userEvent.click(document.body);

		expect(list?.parentElement).toHaveAttribute("aria-hidden", "true");
	});
});
