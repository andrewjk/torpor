import { getByRole, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import MenuEdgeCases from "./components/MenuEdgeCases.torp";

describe("Menu edge cases", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("all disabled items have aria-disabled", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuEdgeCases);

		const menu = getByRole(container, "menu");
		const disabledItems = menu.querySelectorAll('[aria-disabled="true"]');
		expect(disabledItems).toHaveLength(2);
	});

	it("disabled items are not focusable via mouse", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuEdgeCases);

		const disabledButton = getByText(container, "Disabled item 1");
		await userEvent.click(disabledButton);
		// The button is disabled, so it should not handle clicks normally
		expect(disabledButton).toBeDisabled();
	});

	it("disabled items have data-disabled attribute", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuEdgeCases);

		const disabledButton = getByText(container, "Disabled item 1");
		expect(disabledButton).toHaveAttribute("data-disabled", "true");
	});

	it("MenuPopoutTrigger hover delay works", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuEdgeCases);

		const trigger = getByText(container, "Popout with delay");

		// Hover should not open immediately
		await userEvent.hover(trigger);
		const submenu = queryByText(container, "Submenu item");
		expect(submenu).not.toBeInTheDocument();
	});
});
