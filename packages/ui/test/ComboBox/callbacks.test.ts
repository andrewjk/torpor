import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it, vi } from "vitest";
import ComboBoxMultiple from "./components/ComboBoxMultiple.torp";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("Callback fires on selection", async () => {
		const callback = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, callback });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));

		expect(callback).toHaveBeenCalledWith("Item 1");
	});

	it("Callback fires for multiple selection", async () => {
		const callback = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxMultiple, { value: [], callback });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));
		const firstArg = callback.mock.calls[0][0];
		expect(Array.isArray(firstArg)).toBe(true);
		expect(firstArg).toContain("Item 1");
		expect(firstArg).toHaveLength(1);

		await userEvent.click(getByText(container, "Item 2"));
		const secondArg = callback.mock.calls[1][0];
		expect(Array.isArray(secondArg)).toBe(true);
		expect(secondArg).toContain("Item 1");
		expect(secondArg).toContain("Item 2");
		expect(secondArg).toHaveLength(2);
	});

	it("ontoggle fires when open", async () => {
		const ontoggle = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, ontoggle });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		expect(ontoggle).toHaveBeenCalledWith(true);

		await userEvent.click(document.body);
		expect(ontoggle).toHaveBeenCalledWith(false);
	});

	it("onopen fires when ComboBox opens", async () => {
		const onopen = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, onopen });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		expect(onopen).toHaveBeenCalledTimes(1);
	});

	it("onclose fires when ComboBox closes with result", async () => {
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, onclose });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));

		expect(onclose).toHaveBeenCalledWith("Item 1");
	});

	it("onclose fires when ComboBox closes without selection", async () => {
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, onclose });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(document.body);

		expect(onclose).toHaveBeenCalledWith(undefined);
	});

	it("onclose fires for multiple with result", async () => {
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxMultiple, { value: [], onclose });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));
		await userEvent.click(getByText(container, "Item 2"));

		await userEvent.click(document.body);

		const result = onclose.mock.calls[0][0];
		expect(Array.isArray(result)).toBe(true);
		expect(result).toContain("Item 1");
		expect(result).toContain("Item 2");
		expect(result).toHaveLength(2);
	});

	it("ontoggle, onopen, and onclose fire in correct order", async () => {
		const ontoggle = vi.fn();
		const onopen = vi.fn();
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, {
			value: null,
			ontoggle,
			onopen,
			onclose,
		});

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		expect(ontoggle).toHaveBeenCalledWith(true);
		expect(onopen).toHaveBeenCalledTimes(1);
		expect(onclose).not.toHaveBeenCalled();

		await userEvent.click(getByText(container, "Item 1"));
		expect(ontoggle).toHaveBeenCalledWith(false);
		expect(onclose).toHaveBeenCalledWith("Item 1");
	});
});
