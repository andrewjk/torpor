import { fireEvent, queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import ComboBoxKeyboard from "./components/ComboBoxKeyboard.torp";

describe("ComboBox", () => {
	it("Typing filters items (case-insensitive)", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("c");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		await userEvent.keyboard("h");
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));

		await userEvent.keyboard("d");
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));
	});

	it("Typing filters items with uppercase", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("C");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		await userEvent.keyboard("A");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
	});

	it("Backspace updates search", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("ca");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Backspace" }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		await userEvent.keyboard("t");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
	});

	it("Multiple characters narrow search", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("c");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		await userEvent.keyboard("h");
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));

		await userEvent.keyboard("i");
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));
	});

	it("No matches shows no highlighted items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("xyz");

		const items = container.querySelectorAll('[role="option"]');
		items.forEach((item) => {
			expect(item).toHaveAttribute("aria-selected", "false");
		});
	});

	it("Arrow navigation clears search", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("ca");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown" }));

		expect(document.activeElement).toBe(queryAllByText(container, "Chinchilla").at(-1));
	});

	it("Enter after search selects item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("ca");
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Enter" }));

		expect(button.textContent.trim()).toBe("Cat");
	});

	it("Escape clears search text", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("ca");

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Escape" }));

		await userEvent.keyboard("d");
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
	});

	it("Escape after search closes ComboBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		const list = container.querySelector('[role="listbox"]')?.parentElement;
		assert(list, "list not found");

		input.focus();

		await userEvent.keyboard("ca");
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Escape" }));

		expect(list).toHaveAttribute("aria-hidden", "true");
	});

	it("Search focuses first matching item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("d");
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
	});

	it("Multiple same letters don't skip items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		button.focus();

		await userEvent.keyboard("c");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		await userEvent.keyboard("c");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
	});
});
