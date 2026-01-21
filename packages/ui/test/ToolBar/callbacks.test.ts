import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vitest";
import ToolBarCallbacks from "./components/ToolBarCallbacks.torp";

describe("ToolBar", () => {
	it("Callbacks - ontoggle fires with correct state when opening", async () => {
		const onToggle = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarCallbacks, { ontoggle: onToggle });

		const trigger = getByText(container, "Popout");

		// Open popout
		await userEvent.click(trigger);

		// ontoggle should be called with true
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it("Callbacks - ontoggle fires with correct state when closing", async () => {
		const onToggle = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarCallbacks, { ontoggle: onToggle });

		const trigger = getByText(container, "Popout");

		// Open then close popout
		await userEvent.click(trigger);
		await userEvent.click(trigger);

		// ontoggle should be called with false
		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it("Callbacks - onopen fires when popout opens", async () => {
		const onOpen = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarCallbacks, { onopen: onOpen });

		const trigger = getByText(container, "Popout");

		// Open popout
		await userEvent.click(trigger);

		// onopen should be called
		expect(onOpen).toHaveBeenCalled();
	});

	it("Callbacks - onclose fires with result when popout closes via trigger", async () => {
		const onClose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarCallbacks, { onclose: onClose });

		const trigger = getByText(container, "Popout");

		// Open then close popout
		await userEvent.click(trigger);
		await userEvent.click(trigger);

		// onclose should be called
		expect(onClose).toHaveBeenCalled();
	});

	it("Callbacks - onclose fires when popout closes via Escape key", async () => {
		const onClose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarCallbacks, { onclose: onClose });

		const trigger = getByText(container, "Popout");

		// Open popout
		await userEvent.click(trigger);

		// Press Escape to close
		await userEvent.keyboard("{Escape}");

		// onclose should be called
		expect(onClose).toHaveBeenCalled();
	});
});
