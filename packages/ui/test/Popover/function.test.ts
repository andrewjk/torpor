import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import PopoverFunction from "./components/PopoverFunction.torp";

describe("Prompt", () => {
	it("Showing with a function", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverFunction);

		// By default, the prompt shouldn't be shown
		expect(queryByText(container, "Which color do you prefer?")).not.toBeInTheDocument();

		// Clicking the button should show the prompt
		await userEvent.click(getByText(container, "Show the prompt"));
		expect(queryByText(container, "Which color do you prefer?")).toBeInTheDocument();
	});
});
