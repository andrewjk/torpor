import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it, vi } from "vite-plus/test";
import ComboBoxMultiple from "./components/ComboBoxMultiple.torp";
import ComboBoxSingle from "./components/ComboBoxSingle.torp";

describe("ComboBox", () => {
	it("onchange fires on selection", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, onchange });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));

		expect(onchange).toHaveBeenCalledWith("Item 1");
	});

	it("onchange fires for multiple selection", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxMultiple, { value: [], onchange });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		await userEvent.click(getByText(container, "Item 1"));
		const firstArg = onchange.mock.calls[0][0];
		expect(Array.isArray(firstArg)).toBe(true);
		expect(firstArg).toContain("Item 1");
		expect(firstArg).toHaveLength(1);

		await userEvent.click(getByText(container, "Item 2"));
		const secondArg = onchange.mock.calls[1][0];
		expect(Array.isArray(secondArg)).toBe(true);
		expect(secondArg).toContain("Item 1");
		expect(secondArg).toContain("Item 2");
		expect(secondArg).toHaveLength(2);
	});

	it("onopen fires when ComboBox opens and onclose when dismissed", async () => {
		const onopen = vi.fn();
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, { value: null, onopen, onclose });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		expect(onopen).toHaveBeenCalledTimes(1);
		expect(onclose).not.toHaveBeenCalled();

		await userEvent.click(document.body);
		expect(onclose).toHaveBeenCalledTimes(1);
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

	it("onopen and onclose fire in correct order", async () => {
		const onopen = vi.fn();
		const onclose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxSingle, {
			value: null,
			onopen,
			onclose,
		});

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);
		expect(onopen).toHaveBeenCalledTimes(1);
		expect(onclose).not.toHaveBeenCalled();

		await userEvent.click(getByText(container, "Item 1"));
		expect(onclose).toHaveBeenCalledWith("Item 1");
	});
});
