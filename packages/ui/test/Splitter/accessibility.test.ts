import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SplitterTest from "./components/SplitterTest.torp";

describe("Splitter (accessibility)", () => {
	it("is a focusable separator with value attributes and a name", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SplitterTest, { min: 10, max: 90, value: 40 });

		const handle = within(container).getByRole("separator", { name: "Resize panes" });
		expect(handle).toHaveAttribute("tabindex", "0");
		expect(handle).toHaveAttribute("aria-orientation", "horizontal");
		expect(handle).toHaveAttribute("aria-valuemin", "10");
		expect(handle).toHaveAttribute("aria-valuemax", "90");
		expect(handle).toHaveAttribute("aria-valuenow", "40");
	});

	it("reports a vertical orientation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SplitterTest, { orientation: "vertical" });

		expect(within(container).getByRole("separator")).toHaveAttribute(
			"aria-orientation",
			"vertical",
		);
	});

	it("marks a disabled handle as disabled and unfocusable", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SplitterTest, { disabled: true });

		const handle = within(container).getByRole("separator");
		expect(handle).toHaveAttribute("aria-disabled", "true");
		expect(handle).toHaveAttribute("tabindex", "-1");
	});
});
