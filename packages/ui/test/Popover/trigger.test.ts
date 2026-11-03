import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import PopoverTrigger from "./components/PopoverTrigger.torp";

describe("Prompt", () => {
	it("Showing with a trigger", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverTrigger);

		// By default, the prompt shouldn't be shown
		expect(queryByText(document.body, "Which color do you prefer?")).not.toBeInTheDocument();
		expect(queryByText(container, "Your favorite color is blue?!")).not.toBeInTheDocument();

		// Clicking the button should show the prompt
		await userEvent.click(getByText(container, "Show the prompt"));
		expect(queryByText(document.body, "Which color do you prefer?")).toBeInTheDocument();

		// Clicking the blue button should hide the prompt and set the value
		await userEvent.click(getByText(document.body, "Blue"));
		expect(queryByText(document.body, "Which color do you prefer?")).not.toBeInTheDocument();
		expect(queryByText(container, "Your favorite color is blue?!")).toBeInTheDocument();
	});

	it("portals the content out of its original ancestors", async () => {
		const container = document.createElement("div");
		// A transform makes the ancestor the containing block for fixed
		// descendants; the popover content must not stay inside it
		container.style.transform = "translateY(10px)";
		document.body.appendChild(container);
		mount(container, PopoverTrigger);

		await userEvent.click(getByText(container, "Show the prompt"));

		const content = document.querySelector(".torp-popover-content")!;
		expect(content.parentElement).toBe(document.body);
		expect(container.contains(content)).toBe(false);
	});
});
