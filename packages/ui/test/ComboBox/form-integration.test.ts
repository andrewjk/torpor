import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("ComboBox in form submits value", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, { value: null, name: "test-field" });

		const button = form.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(form, "Item 1"));

		const input = form.querySelector('input[name="test-field"]');
		assert(input, "input not found");

		expect(input.value).toBe("Item 1");

		form.remove();
	});

	it("name prop creates form field", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, { value: null, name: "my-combobox" });

		const input = form.querySelector('input[name="my-combobox"]');
		assert(input, "input not found");

		expect(input).toBeInTheDocument();

		form.remove();
	});

	it("Required attribute affects form validation", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, {
			value: null,
			name: "required-field",
			required: true,
		});

		const input = form.querySelector('input[name="required-field"]');
		assert(input, "input not found");

		expect(input).toHaveAttribute("required");

		expect(input.checkValidity()).toBe(false);

		form.remove();
	});

	it("Form submission includes ComboBox value", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, { value: null, name: "field-name" });

		const button = form.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(form, "Item 2"));

		const input = form.querySelector('input[name="field-name"]');
		assert(input, "input not found");

		expect(input.value).toBe("Item 2");

		const formData = new FormData(form);
		expect(formData.get("field-name")).toBe("Item 2");

		form.remove();
	});

	it("Form with required ComboBox validates", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, {
			value: null,
			name: "test-field",
			required: true,
		});

		const input = form.querySelector('input[name="test-field"]');
		assert(input, "input not found");

		expect(form.checkValidity()).toBe(false);

		await userEvent.click(form.getElementsByTagName("button")[0]);
		await userEvent.click(getByText(form, "Item 1"));

		expect(input.value).toBe("Item 1");

		form.remove();
	});

	it("Multiple ComboBoxes in form have unique names", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		const container1 = document.createElement("div");
		form.appendChild(container1);
		mount(container1, ComboBoxSingle, { value: null, name: "field1" });

		const container2 = document.createElement("div");
		form.appendChild(container2);
		mount(container2, ComboBoxSingle, { value: null, name: "field2" });

		const input1 = form.querySelector('input[name="field1"]');
		const input2 = form.querySelector('input[name="field2"]');

		assert(input1, "input1 not found");
		assert(input2, "input2 not found");

		expect(input1).toBeInTheDocument();
		expect(input2).toBeInTheDocument();

		form.remove();
	});

	it("ComboBox value updates when form resets", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, { value: "Item 1", name: "test-field" });

		const input = form.querySelector('input[name="test-field"]');
		assert(input, "input not found");

		expect(input.value).toBe("Item 1");

		form.reset();

		form.remove();
	});

	it("ComboBox without name doesn't create form field", async () => {
		const form = document.createElement("form");
		document.body.appendChild(form);

		mount(form, ComboBoxSingle, { value: null });

		const button = form.getElementsByTagName("button")[0];
		assert(button, "button not found");

		expect(button).toBeInTheDocument();

		form.remove();
	});
});
