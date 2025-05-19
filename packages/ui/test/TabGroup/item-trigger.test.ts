import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TabGroupTrigger from "./components/TabGroupTrigger.torp";

describe("TabGroup", () => {
	it("Item trigger", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TabGroupTrigger);

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		// Clicking header 1 should reveal body 1
		await userEvent.click(getByText(container, "Header 1"));
		expect(queryByText(container, "Content 1")).toBeInTheDocument();

		// Clicking header 2 should hide body 1 and reveal body 2
		await userEvent.click(getByText(container, "Header 2"));
		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();

		// Clicking header 2 again should keep body 2
		await userEvent.click(getByText(container, "Header 2"));
		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
	});
});
