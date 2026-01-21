import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vitest";
import DrawerCallbacks from "./components/DrawerCallbacks.torp";
import DrawerControlled from "./components/DrawerControlled.torp";

describe("Drawer", () => {
	it("Callbacks - ontoggle fires with correct state when opening", async () => {
		const onToggle = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { ontoggle: onToggle });

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// ontoggle should be called with true
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it("Callbacks - ontoggle fires with correct state when closing", async () => {
		const onToggle = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { ontoggle: onToggle });

		const trigger = getByText(container, "Open Drawer");

		// Open then close drawer
		await userEvent.click(trigger);
		await userEvent.click(trigger);

		// ontoggle should be called with false
		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it("Callbacks - onopen fires when drawer opens", async () => {
		const onOpen = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { onopen: onOpen });

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// onopen should be called
		expect(onOpen).toHaveBeenCalled();
	});

	it("Callbacks - onclose fires with result when drawer closes via trigger", async () => {
		const onClose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { onclose: onClose });

		const trigger = getByText(container, "Open Drawer");

		// Open then close drawer
		await userEvent.click(trigger);
		await userEvent.click(trigger);

		// onclose should be called
		expect(onClose).toHaveBeenCalled();
	});

	it("Callbacks - onclose fires when drawer closes via overlay click", async () => {
		const onClose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { onclose: onClose });

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// Click overlay to close
		const overlay = container.querySelector(".torp-drawer-overlay");
		if (overlay) await userEvent.click(overlay);

		// onclose should be called
		expect(onClose).toHaveBeenCalled();
	});

	it("Callbacks - onclose fires when drawer closes via Escape key", async () => {
		const onClose = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerCallbacks, { onclose: onClose });

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// Press Escape to close
		await userEvent.keyboard("{Escape}");

		// onclose should be called
		expect(onClose).toHaveBeenCalled();
	});

	it("Controlled - drawer respects visible prop", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerControlled);

		// Drawer should be visible because visible={true}
		expect(queryByText(container, "This drawer is controlled externally.")).toBeInTheDocument();
	});

	// Is this something that should be implemented?
	it.skip("Controlled - drawer with visible={true} ignores trigger clicks", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerControlled);

		// Drawer is visible
		expect(queryByText(container, "This drawer is controlled externally.")).toBeInTheDocument();

		// Clicking anywhere (drawer has no trigger but clicking overlay should not close)
		const overlay = container.querySelector(".torp-drawer-overlay");
		if (overlay) {
			await userEvent.click(overlay);
			// Should still be visible because it's controlled
			expect(queryByText(container, "This drawer is controlled externally.")).toBeInTheDocument();
		}
	});
});
