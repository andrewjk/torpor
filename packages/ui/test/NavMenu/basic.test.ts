import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import NavMenu from "./components/NavMenu.torp";

describe("NavMenu", () => {
	it("Basic operation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NavMenu);

		// By default, body 1 should be displayed
		expect(queryByText(container, "Home")).toBeInTheDocument();
		expect(queryByText(container, "Subpage 1")).not.toBeInTheDocument();

		// Clicking header 2 should hide body 1 and reveal body 2
		await userEvent.click(getByText(container, "Subpages"));
		expect(queryByText(container, "Subpage 1")).toBeInTheDocument();
	});
});
