import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import ListBoxSingle from "./components/ListBoxSingle.torp";

describe("ListBox", () => {
	it("Single item default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxSingle, { value: 1 });

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Content 3")).toBeInTheDocument();
	});
});
