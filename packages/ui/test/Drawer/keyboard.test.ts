import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import DrawerAccessibility from "./components/DrawerAccessibility.torp";
import DrawerNoOverlay from "./components/DrawerNoOverlay.torp";
import DrawerWithDialog from "./components/DrawerWithDialog.torp";

describe("Drawer", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("Keyboard - Escape key closes modal drawer", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer content for accessibility testing.")).toBeInTheDocument();

		// Press Escape to close
		await userEvent.keyboard("{Escape}");
		expect(
			queryByText(container, "Drawer content for accessibility testing."),
		).not.toBeInTheDocument();
	});

	it("Keyboard - Tab cycles focus within modal drawer", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerWithDialog);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer content for accessibility testing.")).toBeInTheDocument();

		// Focus should be trapped - verify by checking document.activeElement
		const drawerContent = container.querySelector('[role="dialog"]') as HTMLElement;
		expect(drawerContent.contains(document.activeElement)).toBe(true);

		// Tab should cycle through focusable elements
		await userEvent.tab();
		expect(drawerContent.contains(document.activeElement)).toBe(true);
	});

	it("Keyboard - Shift+Tab cycles backwards within modal drawer", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerWithDialog);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// Shift+Tab should also stay within drawer
		await userEvent.tab({ shift: true });
		const drawerContent = container.querySelector('[role="dialog"]') as HTMLElement;
		expect(drawerContent.contains(document.activeElement)).toBe(true);
	});

	it("Keyboard - Focus returns to trigger when modal drawer closes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// Close drawer with Escape
		await userEvent.keyboard("{Escape}");

		// Focus should return to trigger
		expect(document.activeElement).toBe(trigger);
	});

	it("Keyboard - Escape key closes non-modal drawer", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerNoOverlay);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);
		expect(queryByText(container, "This drawer has no overlay.")).toBeInTheDocument();

		// Press Escape to close
		await userEvent.keyboard("{Escape}");
		expect(queryByText(container, "This drawer has no overlay.")).not.toBeInTheDocument();
	});

	it("Keyboard - Trigger is keyboard accessible", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");

		// Focus trigger
		trigger.focus();
		expect(document.activeElement).toBe(trigger);

		// Press Enter or Space to activate
		await userEvent.keyboard("{Enter}");
		expect(queryByText(container, "Drawer content for accessibility testing.")).toBeInTheDocument();

		// Close and try Space
		await userEvent.keyboard("{Escape}");
		trigger.focus();
		await userEvent.keyboard(" ");
		expect(queryByText(container, "Drawer content for accessibility testing.")).toBeInTheDocument();
	});
});
