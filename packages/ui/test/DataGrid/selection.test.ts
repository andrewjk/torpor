import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import SelectableGrid from "./components/SelectableGrid.torp";

function cell(container: HTMLElement, row: number, col: number): HTMLElement {
	return container.querySelector(`td[data-cell="${row}:${col}"]`)!;
}

function mountGrid(selection?: "row" | "cell", props: Record<string, any> = {}): HTMLElement {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SelectableGrid as any, { selection, ...props });
	return container;
}

function press(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

/** The aria-selected of every rendered body row, in order */
function rowSelections(container: HTMLElement): (string | null)[] {
	return [...container.querySelectorAll("tbody tr")].map((tr) => tr.getAttribute("aria-selected"));
}

describe("DataGrid - Selection", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("is off by default: clicking sets no aria-selected", async () => {
		const container = mountGrid();

		await userEvent.click(cell(container, 1, 0));

		expect(container.querySelector("[aria-selected]")).toBeNull();
		expect(container.querySelector(".selection")!.textContent).toBe("");
	});

	it("selects a row on click and reports aria-selected on it", async () => {
		const container = mountGrid("row");

		await userEvent.click(cell(container, 1, 0));

		expect(rowSelections(container)).toEqual([null, "true"]);
		expect(container.querySelector(".selection")!.textContent).toBe("1");
	});

	it("selects a cell on click and reports aria-selected on it", async () => {
		const container = mountGrid("cell");

		await userEvent.click(cell(container, 1, 1));

		expect(cell(container, 1, 1)).toHaveAttribute("aria-selected", "true");
		expect(cell(container, 1, 0)).not.toHaveAttribute("aria-selected");
		expect(container.querySelector(".selection")!.textContent).toBe(
			JSON.stringify({ row: 1, col: 1 }),
		);
	});

	it("selects the focused row with Space", () => {
		const container = mountGrid("row");
		cell(container, 1, 1).focus();

		press(cell(container, 1, 1), " ");

		expect(rowSelections(container)).toEqual([null, "true"]);
		expect(container.querySelector(".selection")!.textContent).toBe("1");
	});

	it("leaves Space alone when no selection mode is set", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), " ");

		expect(container.querySelector("[aria-selected]")).toBeNull();
	});

	it("moves the selection when another row is clicked", async () => {
		const container = mountGrid("row");

		await userEvent.click(cell(container, 0, 0));
		await userEvent.click(cell(container, 1, 0));

		expect(rowSelections(container)).toEqual([null, "true"]);
		expect(container.querySelector(".selection")!.textContent).toBe("1");
	});

	it("clears the selection when paging, since indexes point at other rows", async () => {
		const container = mountGrid("row");
		await userEvent.click(cell(container, 1, 0));
		expect(container.querySelector(".selection")!.textContent).toBe("1");

		cell(container, 0, 0).focus();
		press(cell(container, 0, 0), "PageDown");

		expect(container.querySelector(".selection")!.textContent).toBe("");
		expect(container.querySelector("[aria-selected='true']")).toBeNull();
	});

	it("reports the selected row and column through onselect", async () => {
		const onselect = vi.fn();
		const container = mountGrid("cell", { onselect });

		await userEvent.click(cell(container, 1, 0));

		expect(onselect).toHaveBeenCalledTimes(1);
		expect(onselect).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Bob" }),
			expect.objectContaining({ key: "name" }),
		);
	});

	it("does not select when clicking a control inside a cell", async () => {
		const onselect = vi.fn();
		const container = mountGrid("row", { onselect });

		const button = document.createElement("button");
		cell(container, 1, 0).appendChild(button);
		await userEvent.click(button);

		expect(onselect).not.toHaveBeenCalled();
		expect(container.querySelector("[aria-selected]")).toBeNull();
	});
});
