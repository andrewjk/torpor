import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DataGrid } from "../../src/DataGrid/index";
import LoaderGrid from "./components/LoaderGrid.torp";
import PagedGrid from "./components/PagedGrid.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountGrid(): HTMLElement {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DataGrid as any, {
		columns: [
			{ key: "name", label: "Name" },
			{ key: "email", label: "Email" },
			{ key: "role", label: "Role" },
		],
		data: [
			{ name: "Alice", email: "alice@example.com", role: "Admin" },
			{ name: "Bob", email: "bob@example.com", role: "Editor" },
			{ name: "Cara", email: "cara@example.com", role: "Viewer" },
		],
	});
	return container;
}

function cell(container: HTMLElement, row: number, col: number): HTMLElement {
	return container.querySelector(`td[data-cell="${row}:${col}"]`)!;
}

function press(element: HTMLElement, key: string, modifiers: Record<string, boolean> = {}) {
	element.dispatchEvent(
		new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers }),
	);
}

function mountComponent(component: any, props: Record<string, any> = {}): HTMLElement {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, component, props);
	return container;
}

/** The text of every rendered body cell in the first column, in row order */
function bodyTexts(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll('tbody td[data-cell$=":0"]'), (td) =>
		td.textContent!.trim(),
	);
}

describe("DataGrid - Keyboard navigation", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("marks the first cell as the tab stop", () => {
		const container = mountGrid();

		expect(cell(container, 0, 0)).toHaveAttribute("tabindex", "0");
		expect(cell(container, 1, 2)).toHaveAttribute("tabindex", "-1");
	});

	it("moves focus with arrow keys", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), "ArrowRight");
		expect(document.activeElement).toBe(cell(container, 0, 1));

		press(cell(container, 0, 1), "ArrowDown");
		expect(document.activeElement).toBe(cell(container, 1, 1));

		press(cell(container, 1, 1), "ArrowLeft");
		expect(document.activeElement).toBe(cell(container, 1, 0));

		press(cell(container, 1, 0), "ArrowUp");
		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("moves to row boundaries with Home and End", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), "End");
		expect(document.activeElement).toBe(cell(container, 0, 2));

		press(cell(container, 0, 2), "Home");
		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("moves to grid corners with Ctrl+Home and Ctrl+End", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), "End", { ctrlKey: true });
		expect(document.activeElement).toBe(cell(container, 2, 2));

		press(cell(container, 2, 2), "Home", { ctrlKey: true });
		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("does not move past the edges of the grid", () => {
		const container = mountGrid();
		cell(container, 2, 2).focus();

		press(cell(container, 2, 2), "ArrowDown");
		press(cell(container, 2, 2), "ArrowRight");
		expect(document.activeElement).toBe(cell(container, 2, 2));
	});

	it("starts navigation from the cell the user clicked", async () => {
		const container = mountGrid();

		await userEvent.click(cell(container, 1, 1));
		press(cell(container, 1, 1), "ArrowRight");

		expect(document.activeElement).toBe(cell(container, 1, 2));
	});

	it("leaves focus alone when the event comes from an interactive element inside a cell", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		const button = document.createElement("button");
		cell(container, 0, 0).appendChild(button);
		button.focus();

		press(button, "ArrowDown");
		expect(document.activeElement).toBe(button);
	});
});

describe("DataGrid - PageUp/PageDown", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("moves to the next page with PageDown, keeping the row position", () => {
		// PagedGrid: five rows, two per page
		const container = mountComponent(PagedGrid);
		cell(container, 1, 0).focus();

		press(cell(container, 1, 0), "PageDown");

		expect(bodyTexts(container)).toEqual(["C", "D"]);
		expect(document.activeElement).toBe(cell(container, 1, 0));
		expect(cell(container, 1, 0).textContent!.trim()).toBe("D");
	});

	it("moves to the previous page with PageUp, keeping the row position", () => {
		const container = mountComponent(PagedGrid);
		cell(container, 1, 0).focus();

		press(cell(container, 1, 0), "PageDown");
		expect(document.activeElement).toBe(cell(container, 1, 0));
		expect(cell(container, 1, 0).textContent!.trim()).toBe("D");

		press(cell(container, 1, 0), "PageUp");

		expect(bodyTexts(container)).toEqual(["A", "B"]);
		expect(document.activeElement).toBe(cell(container, 1, 0));
		expect(cell(container, 1, 0).textContent!.trim()).toBe("B");
	});

	it("clamps PageDown on the last page, settling on its last row", () => {
		const container = mountComponent(PagedGrid);
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), "PageDown"); // page 2
		press(cell(container, 0, 0), "PageDown"); // page 3 has just "E"
		expect(bodyTexts(container)).toEqual(["E"]);
		// The requested row position (1) clamps to the partial page's last row
		expect(document.activeElement).toBe(cell(container, 0, 0));

		press(cell(container, 0, 0), "PageDown");

		expect(bodyTexts(container)).toEqual(["E"]);
		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("clamps PageUp on the first page, settling on its first row", () => {
		const container = mountComponent(PagedGrid);
		cell(container, 1, 0).focus();

		press(cell(container, 1, 0), "PageUp");

		expect(bodyTexts(container)).toEqual(["A", "B"]);
		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("keeps focus in place on a grid without paging", () => {
		const container = mountGrid();
		cell(container, 0, 0).focus();

		press(cell(container, 0, 0), "PageDown");

		expect(document.activeElement).toBe(cell(container, 0, 0));
	});

	it("restores focus after a paged loader reload", async () => {
		const requests: any[] = [];
		const resolvers: ((value: any) => void)[] = [];
		const load = (request: any) =>
			new Promise((r) => {
				requests.push(request);
				resolvers.push(r);
			});
		const container = mountComponent(LoaderGrid, { load, pageSize: 2 });

		resolvers[0]({ items: [{ name: "A" }, { name: "B" }], total: 6 });
		await tick();
		cell(container, 1, 0).focus();

		press(cell(container, 1, 0), "PageDown");
		await tick();
		expect(requests.at(-1)).toMatchObject({ page: 2, pageSize: 2 });

		resolvers.at(-1)!({ items: [{ name: "C" }, { name: "D" }], total: 6 });
		await tick();

		expect(bodyTexts(container)).toEqual(["C", "D"]);
		expect(document.activeElement).toBe(cell(container, 1, 0));
		expect(cell(container, 1, 0).textContent!.trim()).toBe("D");
	});
});
