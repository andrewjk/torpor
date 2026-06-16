import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("placeholder displays when empty", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, placeholder: "Select an item" });

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input).toHaveAttribute("placeholder", "Select an item");
	});

	it("required attribute is set", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, required: true });

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input).toHaveAttribute("required");
	});

	it("required attribute is not set when false", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, required: false });

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input).not.toHaveAttribute("required");
	});

	it("name attribute is set", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, name: "test-combobox" });

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input).toHaveAttribute("name", "test-combobox");
	});

	it("id prop is applied correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, id: "test-id" });

		const root = container.firstElementChild;
		assert(root, "root not found");

		expect(root).toHaveAttribute("id", "test-id");
	});

	it("class prop is applied", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, class: "custom-class" });

		const root = container.firstElementChild;
		assert(root, "root not found");

		expect(root).toHaveClass("custom-class");
		expect(root).toHaveClass("torp-combo-box");
	});

	it("style prop is applied", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, style: { color: "red" } });

		const root = container.firstElementChild;
		assert(root, "root not found");

		expect(root).toHaveStyle({ color: "rgb(255, 0, 0)" });
	});

	it("aria-label is set correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, {
			value: null,
			ariaLabel: "Choose an option",
		});

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input).toHaveAttribute("aria-label", "Choose an option");
	});

	it("visible prop controls initial state", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, visible: true });

		const list = container.querySelector('[role="listbox"]');
		assert(list, "listbox not found");

		expect(list).not.toHaveAttribute("aria-hidden");
	});

	it("visible prop controls listbox visibility", async () => {
		const verify = (visible: boolean) => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			mount(container, ComboBoxSingle, { value: null, visible });
			const content = container.querySelector('.torp-combo-box-content')!;
			return visible ? !content.hasAttribute("aria-hidden") : content.getAttribute("aria-hidden") === "true";
		};
		expect(verify(false)).toBe(true);
		expect(verify(true)).toBe(true);
	});

	it("placeholder is removed when value is set", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, {
			value: "Item 1",
			placeholder: "Select an item",
		});

		const input = container.querySelector("input");
		assert(input, "input not found");

		expect(input.value).toBe("Item 1");
	});
});
