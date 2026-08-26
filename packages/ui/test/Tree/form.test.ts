import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TreeFormTest from "./components/TreeFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("Tree (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeFormTest, {});

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "picked");
	});

	it("validates when a tree item is selected", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeFormTest, {});

		const tree = within(container).getByRole("tree");

		// The initial value fails the schema
		fireEvent.focusOut(tree);
		await tick();

		expect(within(container).getByText("Pick folder 2")).toBeInTheDocument();
		expect(tree).toHaveAttribute("aria-invalid", "true");

		// Selecting folder 2 passes
		fireEvent.click(within(tree).getByText("Folder 2"));
		await tick();

		expect(within(container).queryByText("Pick folder 2")).toBeNull();
		expect(tree).not.toHaveAttribute("aria-invalid");
	});
});
