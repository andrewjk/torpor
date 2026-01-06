import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TreeSingle from "./components/TreeSingle.torp";

describe("Tree (single selection)", () => {
	it("Single selected item default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, { value: "item-2" });

		expect(within(container).getByText("Folder 1")).toBeInTheDocument();
		expect(within(container).getByText("Folder 2")).toBeInTheDocument();
		expect(within(container).getByText("File 3")).toBeInTheDocument();

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems[0]).toHaveAttribute("aria-selected", "false");
		expect(treeItems[1]).toHaveAttribute("aria-selected", "true");
		expect(treeItems[2]).toHaveAttribute("aria-selected", "false");
	});

	it("No selected items by default", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		expect(within(container).getByText("Folder 1")).toBeInTheDocument();
		expect(within(container).getByText("Folder 2")).toBeInTheDocument();
		expect(within(container).getByText("File 3")).toBeInTheDocument();

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems[0]).toHaveAttribute("aria-selected", "false");
		expect(treeItems[1]).toHaveAttribute("aria-selected", "false");
		expect(treeItems[2]).toHaveAttribute("aria-selected", "false");
	});
});
