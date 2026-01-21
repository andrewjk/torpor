import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DrawerAccessibility from "./components/DrawerAccessibility.torp";
import DrawerNoOverlay from "./components/DrawerNoOverlay.torp";

describe("Drawer", () => {
	it("Accessibility - Trigger button has correct ARIA attributes when closed", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");

		// aria-expanded should be false when closed
		expect(trigger).toHaveAttribute("aria-expanded", "false");

		// aria-haspopup should be "dialog"
		expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

		// aria-controls should reference the drawer content
		expect(trigger).toHaveAttribute("aria-controls");
	});

	it("Accessibility - Trigger button has correct ARIA attributes when open", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);

		// aria-expanded should be true when open
		expect(trigger).toHaveAttribute("aria-expanded", "true");

		// aria-controls should still reference the drawer content
		expect(trigger).toHaveAttribute("aria-controls");
	});

	it("Accessibility - Drawer content has correct ARIA attributes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);

		const drawerContent = queryByText(
			container,
			"Drawer content for accessibility testing.",
		)?.closest(".torp-drawer-content") as HTMLElement;

		expect(drawerContent).toBeInTheDocument();

		// TODO: Only if it contains a dialog, menu, etc...
		// role="dialog"
		//expect(drawerContent).toHaveAttribute("role", "dialog");

		// aria-modal should be true for modal drawer
		expect(drawerContent).toHaveAttribute("aria-modal", "true");

		// aria-label should be present
		expect(drawerContent).toHaveAttribute("aria-label", "Test Drawer");
	});

	it("Accessibility - Overlay has tabindex=-1", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);

		const overlay = container.querySelector(".torp-drawer-overlay");
		expect(overlay).toHaveAttribute("tabindex", "-1");
	});

	it("Accessibility - Drawer has aria-hidden when closed", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerAccessibility);

		// When closed, drawer content should not be in the DOM
		expect(
			queryByText(container, "Drawer content for accessibility testing."),
		).not.toBeInTheDocument();

		// When open, it should be in the DOM
		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer content for accessibility testing.")).toBeInTheDocument();
	});

	//it("Accessibility - All interactive elements are descendants of dialog", async () => {
	//	const container = document.createElement("div");
	//	document.body.appendChild(container);
	//	mount(container, DrawerAccessibility);
	//
	//	const trigger = getByText(container, "Open Drawer");
	//	await userEvent.click(trigger);
	//
	//	const drawerContent = container.querySelector('[role="dialog"]') as HTMLElement;
	//	const actionButton = getByText(container, "Action Button");
	//
	//	// The action button should be a descendant of the dialog
	//	expect(drawerContent.contains(actionButton)).toBe(true);
	//});

	it("Accessibility - Non-modal drawer has no aria-modal", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerNoOverlay);

		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);

		const drawerContent = container.querySelector(".torp-drawer-content") as HTMLElement;

		// Non-modal drawer should not have aria-modal
		expect(drawerContent).not.toHaveAttribute("aria-modal");
	});
});
