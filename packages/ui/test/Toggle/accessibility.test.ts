import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ToggleTest from "./components/ToggleTest.torp";

describe("Toggle (accessibility)", () => {
	it("has a switch role", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, {});

		expect(within(container).getByRole("switch")).toBeInTheDocument();
	});

	it("reflects the checked state with aria-checked", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, { checked: true });

		expect(within(container).getByRole("switch")).toBeChecked();
		expect(within(container).getByRole("switch")).toHaveAttribute("aria-checked", "true");
	});

	it("is unchecked by default", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, {});

		expect(within(container).getByRole("switch")).not.toBeChecked();
		expect(within(container).getByRole("switch")).toHaveAttribute("aria-checked", "false");
	});

	it("has an accessible name from the ariaLabel prop", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleTest, { ariaLabel: "Notifications" });

		expect(within(container).getByRole("switch", { name: "Notifications" })).toBeInTheDocument();
	});
});
