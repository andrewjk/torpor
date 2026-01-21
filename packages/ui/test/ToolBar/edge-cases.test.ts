import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarDisabledOnly from "./components/ToolBarDisabledOnly.torp";
import ToolBarEmpty from "./components/ToolBarEmpty.torp";
import ToolBarSeparatorsOnly from "./components/ToolBarSeparatorsOnly.torp";

describe("ToolBar", () => {
	it("Empty toolbar renders correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarEmpty);
		expect(container.querySelector('[role="toolbar"]')).toBeInTheDocument();
	});

	it("Only separators renders correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarSeparatorsOnly);
		expect(container.querySelectorAll('[role="separator"]').length).toBe(3);
	});

	it("All items disabled behaves correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarDisabledOnly);
		const buttons = container.querySelectorAll('button[aria-disabled="true"]');
		expect(buttons.length).toBe(3);
	});
});
