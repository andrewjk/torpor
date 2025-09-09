import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import NotificationVariable from "./components/NotificationVariable.torp";

describe("Notification", () => {
	it("Showing with a variable", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NotificationVariable);

		// By default, the notification shouldn't be shown
		expect(queryByText(container, "Here's a notification")).not.toBeInTheDocument();

		// Clicking the button should show the notification
		await userEvent.click(getByText(container, "Show a notification"));
		expect(queryByText(container, "Here's a notification")).toBeInTheDocument();

		// Clicking the close button should hide the notification
		await userEvent.click(getByText(container, "Close me"));
		expect(queryByText(container, "Here's a notification")).not.toBeInTheDocument();
	});
});
