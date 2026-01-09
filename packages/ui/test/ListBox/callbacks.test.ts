import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vitest";
import ListBoxCallbacks from "./components/ListBoxCallbacks.torp";

describe("ListBox", () => {
	it("onchange fires when item is selected in single-select", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "single", onchange });

		await getByText(container, "Content 1").click();

		expect(onchange).toHaveBeenCalledWith(0);
	});

	it("onchange fires when selection changes in single-select", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "single", onchange });

		await getByText(container, "Content 1").click();
		await getByText(container, "Content 2").click();

		expect(onchange).toHaveBeenCalledTimes(2);
		expect(onchange).toHaveBeenNthCalledWith(1, 0);
		expect(onchange).toHaveBeenNthCalledWith(2, 1);
	});

	it("onchange fires when item is deselected in single-select", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "single", onchange, value: 0 });

		await getByText(container, "Content 1").click();

		expect(onchange).toHaveBeenCalledWith(undefined);
	});

	it("onchange fires when items are selected in multi-select", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "multiple", onchange, value: [] });

		await getByText(container, "Content 1").click();

		const callArgs = onchange.mock.calls[0][0];
		expect(callArgs).toContain(0);
	});

	it("onchange fires when multiple items are selected", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "multiple", onchange, value: [] });

		await getByText(container, "Content 1").click();
		await getByText(container, "Content 2").click();
		await getByText(container, "Content 3").click();

		expect(onchange).toHaveBeenCalledTimes(3);
		expect(onchange.mock.calls[0][0]).toContain(0);
		expect(onchange.mock.calls[1][0]).toContain(0);
		expect(onchange.mock.calls[1][0]).toContain(1);
		expect(onchange.mock.calls[2][0]).toContain(0);
		expect(onchange.mock.calls[2][0]).toContain(1);
		expect(onchange.mock.calls[2][0]).toContain(2);
	});

	it("ontoggle fires when item is selected", async () => {
		const onToggle0 = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "single", onToggle0 });

		await getByText(container, "Content 1").click();

		expect(onToggle0).toHaveBeenCalledWith(true);
	});

	it("ontoggle fires when item is deselected", async () => {
		const onToggle0 = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "single", onToggle0, value: 0 });

		await getByText(container, "Content 1").click();

		expect(onToggle0).toHaveBeenCalledWith(false);
	});

	it("ontoggle fires for multiple items independently", async () => {
		const onToggle0 = vi.fn();
		const onToggle1 = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxCallbacks, { type: "multiple", onToggle0, onToggle1 });

		getByText(container, "Content 1").click();
		getByText(container, "Content 2").click();

		expect(onToggle0).toHaveBeenCalledWith(true);
		expect(onToggle1).toHaveBeenCalledWith(true);
	});
});
