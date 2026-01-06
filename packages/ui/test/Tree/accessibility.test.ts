import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TreeSingle from "./components/TreeSingle.torp";

describe("Tree (accessibility)", () => {
	it("Has correct ARIA attributes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const tree = container.querySelector('[role="tree"]');
		expect(tree).toBeInTheDocument();

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems).toHaveLength(3);
	});

	it("Has correct aria-level for nested items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems[0]).toHaveAttribute("aria-level");
		expect(treeItems[1]).toHaveAttribute("aria-level");
		expect(treeItems[2]).toHaveAttribute("aria-level");
	});

	it("Has correct aria-multiselectable attribute", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, { type: "multiple" });

		const tree = container.querySelector('[role="tree"]');
		expect(tree).toHaveAttribute("aria-multiselectable", "true");
	});

	it("Has correct aria-disabled attribute", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, {});

		const treeItems = within(container).getAllByRole("treeitem");
		expect(treeItems[0]).not.toHaveAttribute("aria-disabled");
	});
});
