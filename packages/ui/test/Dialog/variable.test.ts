import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DialogVariable from "./components/DialogVariable.torp";

describe("Dialog", () => {
	it("Showing with a variable", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DialogVariable);

		// By default, the modal shouldn't be shown
		expect(queryByText(container, "Which color do you prefer?")).not.toBeInTheDocument();
		expect(queryByText(container, "Your favorite color is blue?!")).not.toBeInTheDocument();

		// Clicking the button should show the modal
		await userEvent.click(getByText(container, "Show the modal"));
		expect(queryByText(container, "Which color do you prefer?")).toBeInTheDocument();

		// Clicking the blue button should hide the modal and set the value
		await userEvent.click(getByText(container, "Blue"));
		expect(queryByText(container, "Which color do you prefer?")).not.toBeInTheDocument();
		expect(queryByText(container, "Your favorite color is blue?!")).toBeInTheDocument();
	});
});
