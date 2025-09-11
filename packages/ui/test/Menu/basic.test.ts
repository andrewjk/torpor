import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import MenuBasic from "./components/MenuBasic.torp";

describe("Menu", () => {
	it("Basic operation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBasic);

		// By default, the top-level buttons should be displayed
		expect(queryByText(container, "Menu button")).toBeInTheDocument();
		expect(queryByText(container, "Check popout button")).toBeInTheDocument();
		expect(queryByText(container, "Radio popout button")).toBeInTheDocument();

		// Submenus should not be displayed
		expect(queryByText(container, "Checked 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Radio 1")).not.toBeInTheDocument();

		// Clicking a popout button should show the appropriate menu
		fireEvent.click(getByText(container, "Check popout button"));
		expect(queryByText(container, "Checked 1")).toBeInTheDocument();
		expect(queryByText(container, "Radio 1")).not.toBeInTheDocument();

		// Clicking another popout button should show that menu instead
		fireEvent.click(getByText(container, "Radio popout button"));
		//expect(queryByText(container, 'Checked 1')).not.toBeInTheDocument();
		expect(queryByText(container, "Radio 1")).toBeInTheDocument();

		// Checking a box should show or hide the indicator
		fireEvent.click(getByText(container, "Check popout button"));
		expect(queryByText(container, "Tick 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Tick 2")).not.toBeInTheDocument();
		fireEvent.click(getByText(container, "Checked 1"));
		expect(queryByText(container, "Tick 1")).toBeInTheDocument();
		expect(queryByText(container, "Tick 2")).not.toBeInTheDocument();
		fireEvent.click(getByText(container, "Checked 2"));
		expect(queryByText(container, "Tick 1")).toBeInTheDocument();
		expect(queryByText(container, "Tick 2")).toBeInTheDocument();
		fireEvent.click(getByText(container, "Checked 1"));
		expect(queryByText(container, "Tick 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Tick 2")).toBeInTheDocument();

		// Checking a radio should show the indicator, and hide another indicator if already selected
		fireEvent.click(getByText(container, "Radio popout button"));
		expect(queryByText(container, "Circle 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Circle 2")).not.toBeInTheDocument();
		fireEvent.click(getByText(container, "Radio 1"));
		expect(queryByText(container, "Circle 1")).toBeInTheDocument();
		expect(queryByText(container, "Circle 2")).not.toBeInTheDocument();
		fireEvent.click(getByText(container, "Radio 2"));
		expect(queryByText(container, "Circle 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Circle 2")).toBeInTheDocument();
	});
});
