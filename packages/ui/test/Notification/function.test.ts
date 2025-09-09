import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import NotificationFunction from "./components/NotificationFunction.torp";

describe("Notification", () => {
	it("Showing with a function", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NotificationFunction);

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
