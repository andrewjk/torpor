import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import NotificationAccessibility from "./components/NotificationAccessibility.torp";

describe("Notification", () => {
	it("Accessibility", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NotificationAccessibility);

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/alert/

		// The widget has a role of alert
		expect(queryByText(container, "Here's a notification")?.parentElement).toHaveAttribute(
			"role",
			"alert",
		);
	});
});
