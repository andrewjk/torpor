import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxFocus from "./components/ListBoxFocus.torp";

describe("ListBox", () => {
	it("Item can be focused programmatically", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxFocus, { value: 0 });

		const item1 = getByText(container, "Content 1");
		item1.focus();

		expect(document.activeElement).toBe(item1);
	});

	it("Keyboard navigation moves focus", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxFocus, { value: 0 });

		const item1 = getByText(container, "Content 1");
		item1.focus();

		item1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

		expect(document.activeElement).toBe(getByText(container, "Content 2"));
	});
});
