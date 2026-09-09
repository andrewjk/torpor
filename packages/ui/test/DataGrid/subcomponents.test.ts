import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import DataGridSubcomponentsTest from "./components/DataGridSubcomponentsTest.torp";

describe("DataGrid (subcomponents)", () => {
	function setup() {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DataGridSubcomponentsTest, {});
		return { container };
	}

	it("renders a sortable header with its own props", async () => {
		const { container } = setup();

		const header = within(container).getByRole("columnheader", { name: "Name" });
		expect(header).toHaveClass("torp-data-grid-sortable", "custom-header");
		expect(header).toHaveClass("torp-data-grid-align-start");
		expect(header).toHaveAttribute("aria-sort", "ascending");
		expect(within(header).getByRole("button", { name: "Name" })).toBeInTheDocument();
	});

	it("renders a plain header without a sort button", async () => {
		const { container } = setup();

		const header = within(container).getByRole("columnheader", { name: "Role" });
		expect(header).not.toHaveClass("torp-data-grid-sortable");
		expect(header).not.toHaveAttribute("aria-sort");
		expect(within(header).queryByRole("button")).not.toBeInTheDocument();
	});

	it("renders a cell with its content, address and tab stop", async () => {
		const { container } = setup();

		const cells = within(container).getAllByRole("gridcell");
		expect(cells[0]).toHaveTextContent("custom content");
		expect(cells[0]).toHaveClass("custom-cell", "torp-data-grid-align-start");
		expect(cells[0]).toHaveAttribute("data-cell", "0:0");
		expect(cells[0]).toHaveAttribute("tabindex", "0");

		// Only the active cell is a tab stop
		expect(cells[1]).toHaveAttribute("data-cell", "1:1");
		expect(cells[1]).toHaveAttribute("tabindex", "-1");
	});
});
