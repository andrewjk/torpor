import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TreeSingle from "./components/TreeSingle.torp";

describe("Tree (keyboard navigation)", () => {
	it("Arrow down navigates to next item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const folder1 = within(container).getByText("Folder 1");
		folder1.focus();
		expect(folder1).toHaveFocus();

		fireEvent.keyDown(folder1, { key: "ArrowDown" });
		expect(within(container).getByText("Folder 2")).toHaveFocus();
	});

	it("Arrow up navigates to previous item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const folder2 = within(container).getByText("Folder 2");
		folder2.focus();
		expect(folder2).toHaveFocus();

		fireEvent.keyDown(folder2, { key: "ArrowUp" });
		expect(within(container).getByText("Folder 1")).toHaveFocus();
	});

	it("Home navigates to first item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const file3 = within(container).getByText("File 3");
		file3.focus();
		expect(file3).toHaveFocus();

		fireEvent.keyDown(file3, { key: "Home" });
		expect(within(container).getByText("Folder 1")).toHaveFocus();
	});

	it("End navigates to last item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const folder1 = within(container).getByText("Folder 1");
		folder1.focus();
		expect(folder1).toHaveFocus();

		fireEvent.keyDown(folder1, { key: "End" });
		expect(within(container).getByText("File 3")).toHaveFocus();
	});

	it("Enter toggles selection", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems[0]).toHaveAttribute("aria-selected", "false");

		const label = within(container).getByText("Folder 1");
		label.focus();
		fireEvent.keyDown(label, { key: "Enter" });
		expect(treeItems[0]).toHaveAttribute("aria-selected", "true");

		fireEvent.keyDown(label, { key: "Enter" });
		expect(treeItems[0]).toHaveAttribute("aria-selected", "false");
	});
});
