import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxWithSeparator from "./components/ListBoxWithSeparator.torp";

describe("ListBox", () => {
	it("ListBoxSeparator has role separator", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxWithSeparator, { value: 0 });

		const separator = queryByText(container, "Separator");
		expect(separator).toHaveAttribute("role", "separator");
	});

	it("ListBoxSeparator has aria-orientation horizontal by default", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxWithSeparator, { value: 0 });

		const separator = queryByText(container, "Separator");
		expect(separator).toHaveAttribute("aria-orientation", "horizontal");
	});

	it("ListBoxSeparator has aria-orientation vertical when specified", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxWithSeparator, { separatorOrientation: "vertical" });

		const separator = queryByText(container, "Separator");
		expect(separator).toHaveAttribute("aria-orientation", "vertical");
	});
});
