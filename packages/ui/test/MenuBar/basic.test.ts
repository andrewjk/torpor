import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import MenuBarBasic from "./components/MenuBarBasic.torp";

describe("MenuBar", () => {
	it("Basic operation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuBarBasic);

		// The top level item should be displayed
		expect(queryByText(container, "Top level")).toBeInTheDocument();
		expect(queryByText(container, "Sub item 1")).not.toBeInTheDocument();

		// Clicking the top level item should show the sub item
		await userEvent.click(getByText(container, "Top level"));
		expect(queryByText(container, "Sub item 1")).toBeInTheDocument();
	});
});
