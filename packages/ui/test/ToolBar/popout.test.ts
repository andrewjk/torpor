import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ToolBarPopoutTest from "./components/ToolBarPopoutTest.torp";

describe("ToolBarPopout", () => {
	it("Popout opens on trigger click", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarPopoutTest);

		const trigger = getByText(container, "Popout 1");

		expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();

		await userEvent.click(trigger);

		expect(queryByText(container, "Item 1.1")).toBeInTheDocument();
	});

	it("Popout closes when clicking outside", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarPopoutTest);

		const trigger = getByText(container, "Popout 1");

		await userEvent.click(trigger);
		expect(queryByText(container, "Item 1.1")).toBeInTheDocument();

		await userEvent.click(document.body);

		expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();
	});

	it("Disabled trigger doesn't open popout", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarPopoutTest);

		const disabledTrigger = getByText(container, "Disabled Popout");

		expect(queryByText(container, "Disabled Item")).not.toBeInTheDocument();

		await userEvent.click(disabledTrigger);

		expect(queryByText(container, "Disabled Item")).not.toBeInTheDocument();
	});

	it("Multiple popouts can exist in toolbar", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToolBarPopoutTest);

		const trigger1 = getByText(container, "Popout 1");
		const trigger2 = getByText(container, "Popout 2");

		await userEvent.click(trigger1);
		expect(queryByText(container, "Item 1.1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2.1")).not.toBeInTheDocument();

		await userEvent.click(trigger2);
		expect(queryByText(container, "Item 1.1")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 2.1")).toBeInTheDocument();
	});
});
