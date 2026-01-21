import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarBasic from "./components/ToolBarBasic.torp";
import ToolBarDisabled from "./components/ToolBarDisabled.torp";
import ToolBarMultiplePopouts from "./components/ToolBarMultiplePopouts.torp";
import ToolBarSeparator from "./components/ToolBarSeparator.torp";

describe("ToolBar", () => {
	it("Basic operation with single popout", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarBasic);

		expect(queryByText(container, "Home")).toBeInTheDocument();
		expect(queryByText(container, "Subpage 1")).not.toBeInTheDocument();

		await userEvent.click(getByText(container, "Subpages"));
		expect(queryByText(container, "Subpage 1")).toBeInTheDocument();
	});

	it("Multiple popouts open independently", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarMultiplePopouts);

		const trigger1 = getByText(container, "Popout 1");
		const trigger2 = getByText(container, "Popout 2");

		await userEvent.click(trigger1);
		expect(queryByText(container, "Item 1.1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2.1")).not.toBeInTheDocument();

		await userEvent.click(trigger2);
		expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 2.1")).toBeInTheDocument();
	});

	it("Separator renders correctly", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarSeparator);

		const separator = container.querySelector('[role="separator"]');
		expect(separator).toBeInTheDocument();
	});

	it("Disabled button has correct attributes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, ToolBarDisabled);

		const disabledButton = queryByText(container, "Disabled");
		const enabledButton = queryByText(container, "Enabled");

		expect(disabledButton).toHaveAttribute("aria-disabled", "true");
		expect(disabledButton).toHaveAttribute("disabled");
		expect(enabledButton).not.toHaveAttribute("aria-disabled");
		expect(enabledButton).not.toHaveAttribute("disabled");
	});
});
