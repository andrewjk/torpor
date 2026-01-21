import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DrawerBasic from "./components/DrawerBasic.torp";
import DrawerNoOverlay from "./components/DrawerNoOverlay.torp";
import DrawerPositions from "./components/DrawerPositions.torp";

describe("Drawer", () => {
	it("Basic operation - toggle drawer open/close via trigger button", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic);

		const trigger = getByText(container, "Open Drawer");

		// Drawer should be closed initially
		expect(queryByText(container, "Drawer Content")).not.toBeInTheDocument();

		// Click trigger to open
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer Content")).toBeInTheDocument();

		// Click trigger again to close
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer Content")).not.toBeInTheDocument();
	});

	it("Close drawer by clicking overlay", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic);

		const trigger = getByText(container, "Open Drawer");

		// Open drawer
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer Content")).toBeInTheDocument();

		// Click overlay to close
		const overlay = container.querySelector(".torp-drawer-overlay");
		expect(overlay).toBeInTheDocument();
		await userEvent.click(overlay!);
		expect(queryByText(container, "Drawer Content")).not.toBeInTheDocument();
	});

	it("Test all drawer positions", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerPositions);

		// Test right drawer
		const rightTrigger = getByText(container, "Right Drawer");
		await userEvent.click(rightTrigger);
		expect(queryByText(container, "Right positioned")).toBeInTheDocument();
		const rightOverlay = container.querySelector(".torp-drawer-overlay");
		if (rightOverlay) await userEvent.click(rightOverlay);

		// Test top drawer
		const topTrigger = getByText(container, "Top Drawer");
		await userEvent.click(topTrigger);
		expect(queryByText(container, "Top positioned")).toBeInTheDocument();
		const topOverlay = container.querySelector(".torp-drawer-overlay");
		if (topOverlay) await userEvent.click(topOverlay);

		// Test bottom drawer
		const bottomTrigger = getByText(container, "Bottom Drawer");
		await userEvent.click(bottomTrigger);
		expect(queryByText(container, "Bottom positioned")).toBeInTheDocument();
	});

	it("Modal vs non-modal drawer behavior - modal drawer has overlay", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic);

		const trigger = getByText(container, "Open Drawer");

		// Open modal drawer
		await userEvent.click(trigger);
		expect(container.querySelector(".torp-drawer-overlay")).toBeInTheDocument();
	});

	it("Non-modal drawer has no overlay", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerNoOverlay);

		const trigger = getByText(container, "Open Drawer");

		// Open non-modal drawer
		await userEvent.click(trigger);
		expect(container.querySelector(".torp-drawer-overlay")).not.toBeInTheDocument();
	});

	it("Only one drawer visible at a time", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerPositions);

		const rightTrigger = getByText(container, "Right Drawer");
		const topTrigger = getByText(container, "Top Drawer");

		// Open right drawer
		await userEvent.click(rightTrigger);
		expect(queryByText(container, "Right positioned")).toBeInTheDocument();
		expect(queryByText(container, "Top positioned")).not.toBeInTheDocument();

		// Close right drawer and open top
		const overlay = container.querySelector(".torp-drawer-overlay");
		if (overlay) await userEvent.click(overlay);
		await userEvent.click(topTrigger);
		expect(queryByText(container, "Right positioned")).not.toBeInTheDocument();
		expect(queryByText(container, "Top positioned")).toBeInTheDocument();
	});

	it("State - drawer position state is correct", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic, { position: "right" });

		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);

		const drawerContent = container.querySelector(".torp-drawer-content");
		expect(drawerContent).toBeInTheDocument();
	});

	it("State - drawer modal state is correct", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic);

		const trigger = getByText(container, "Open Drawer");
		await userEvent.click(trigger);

		const drawerContent = container.querySelector(".torp-drawer-content") as HTMLElement;
		expect(drawerContent).toHaveAttribute("aria-modal", "true");
	});

	it("State - drawer visible state updates correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DrawerBasic);

		const trigger = getByText(container, "Open Drawer");

		// Closed initially
		expect(queryByText(container, "Drawer Content")).not.toBeInTheDocument();

		// Open
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer Content")).toBeInTheDocument();

		// Close
		await userEvent.click(trigger);
		expect(queryByText(container, "Drawer Content")).not.toBeInTheDocument();
	});
});
