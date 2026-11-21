import { queryAllByRole, queryByRole, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import { DataGrid } from "../../src/DataGrid/index";
import type { DataColumn, DataGridLoadEvent } from "../../src/DataGrid/index";
import LoaderGrid from "./components/LoaderGrid.torp";
import DynamicColumnsGrid from "./components/DynamicColumnsGrid.torp";
import PagedGrid from "./components/PagedGrid.torp";
import StaticGrid from "./components/StaticGrid.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountGrid(props: Record<string, any>): HTMLElement {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DataGrid as any, props);
	return container;
}

describe("DataGrid - Basic", () => {
	it("renders headers and cell values from static data", () => {
		const container = mountGrid({
			columns: [
				{ key: "name", label: "Name" },
				{ key: "email", label: "Email" },
			],
			data: [
				{ name: "Alice", email: "alice@example.com" },
				{ name: "Bob", email: "bob@example.com" },
			],
		});

		expect(queryByRole(container, "columnheader", { name: "Name" })).toBeInTheDocument();
		expect(queryByRole(container, "columnheader", { name: "Email" })).toBeInTheDocument();
		expect(queryByText(container, "Alice")).toBeInTheDocument();
		expect(queryByText(container, "bob@example.com")).toBeInTheDocument();
		expect(queryAllByRole(container, "gridcell")).toHaveLength(4);
	});

	it("defaults header labels to the column key", () => {
		const container = mountGrid({
			columns: [{ key: "title" }],
			data: [{ title: "Hello" }],
		});

		expect(queryByRole(container, "columnheader", { name: "title" })).toBeInTheDocument();
		expect(queryByText(container, "Hello")).toBeInTheDocument();
	});

	it("sets grid roles and aria attributes", () => {
		const container = mountGrid({
			columns: [{ key: "name" }],
			data: [{ name: "Alice" }],
			ariaLabel: "People",
		});

		const grid = queryByRole(container, "grid");
		expect(grid).toHaveAttribute("aria-label", "People");
		// Every row is in the DOM, so no counts or positions are needed
		expect(grid).not.toHaveAttribute("aria-rowcount");
		expect(container.querySelector("thead tr")).not.toHaveAttribute("aria-rowindex");
		expect(container.querySelector("tbody tr")).not.toHaveAttribute("aria-rowindex");
	});

	it("renders a caption when provided", () => {
		const container = mountGrid({
			columns: [{ key: "name" }],
			data: [{ name: "Alice" }],
			caption: "Team members",
		});

		expect(queryByText(container, "Team members")).toBeInTheDocument();
	});

	it("supports custom cell rendering via the default slot", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StaticGrid);

		// Name cells are wrapped in <strong>, email cells are plain text
		expect(container.querySelector("tbody td strong")).toHaveTextContent("Cara");
		expect(container.querySelector("tbody td:nth-child(2)")!.textContent!.trim()).toBe(
			"cara@example.com",
		);
	});

	it("uses getValue to extract cell values when provided", () => {
		const columns: DataColumn[] = [
			{ key: "fullname", label: "Name", getValue: (row: any) => `${row.first} ${row.last}` },
		];
		const container = mountGrid({ columns, data: [{ first: "Ada", last: "Lovelace" }] });

		expect(queryByText(container, "Ada Lovelace")).toBeInTheDocument();
	});

	it("re-renders headers and cells when columns change", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DynamicColumnsGrid);

		expect(queryAllByRole(container, "gridcell")).toHaveLength(2);
		expect(queryByRole(container, "columnheader", { name: "Role" })).not.toBeInTheDocument();

		// Adding a column to the same array re-renders headers and cells
		await userEvent.click(queryByText(container, "push column")!);
		await tick();

		expect(queryByRole(container, "columnheader", { name: "Role" })).toBeInTheDocument();
		expect(queryAllByRole(container, "gridcell")).toHaveLength(4);

		// Replacing the array does too, dropping the pushed column
		await userEvent.click(queryByText(container, "replace columns")!);
		await tick();

		expect(queryByRole(container, "columnheader", { name: "Role" })).not.toBeInTheDocument();
		expect(queryByRole(container, "columnheader", { name: "Age" })).toBeInTheDocument();
		expect(queryAllByRole(container, "gridcell")).toHaveLength(4);
		expect(queryByText(container, "30")).toBeInTheDocument();
	});

	it("shows the empty slot when there are no rows", async () => {
		let resolve!: (value: DataGridLoadEvent) => void;
		const load = () =>
			new Promise<DataGridLoadEvent>((r) => {
				resolve = r;
			});
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderGrid as any, { load });

		resolve({ items: [] });
		await tick();

		expect(queryByText(container, "Nothing here.")).toBeInTheDocument();
	});

	it("throws when props are invalid", () => {
		const columns: DataColumn[] = [{ key: "name" }];
		const data = [{ name: "Alice" }];
		const load = () => ({ items: data });

		expect(() => mountGrid({ columns: [], data })).toThrow();
		expect(() => mountGrid({ columns, load, data })).toThrow();
		expect(() => mountGrid({ columns })).toThrow();
	});
});

describe("DataGrid - Row counts and positions", () => {
	/** The aria-rowindex of every rendered body row, in order */
	function bodyRowIndexes(container: HTMLElement): (string | null)[] {
		return [...container.querySelectorAll("tbody tr:not(.torp-data-grid-spacer)")].map((tr) =>
			tr.getAttribute("aria-rowindex"),
		);
	}

	function pressPageDown(container: HTMLElement) {
		const cell = container.querySelector<HTMLElement>('td[data-cell="0:0"]')!;
		cell.focus();
		cell.dispatchEvent(
			new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }),
		);
	}

	it("positions paged rows across page flips", async () => {
		// PagedGrid: five data rows, two per page
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PagedGrid);

		expect(queryByRole(container, "grid")).toHaveAttribute("aria-rowcount", "6");
		expect(container.querySelector("thead tr")).toHaveAttribute("aria-rowindex", "1");
		expect(bodyRowIndexes(container)).toEqual(["2", "3"]);

		await userEvent.click(queryByText(container, "next page")!);
		await tick();

		expect(bodyRowIndexes(container)).toEqual(["4", "5"]);
	});

	it("reports -1 for a paged loader without a total, keeping row positions", async () => {
		const resolvers: ((value: DataGridLoadEvent) => void)[] = [];
		const load = () =>
			new Promise<DataGridLoadEvent>((r) => {
				resolvers.push(r);
			});
		const container = mountGrid({ columns: [{ key: "name" }], load, pageSize: 2 });

		resolvers[0]({ items: [{ name: "A" }, { name: "B" }] });
		await tick();

		expect(queryByRole(container, "grid")).toHaveAttribute("aria-rowcount", "-1");
		expect(bodyRowIndexes(container)).toEqual(["2", "3"]);

		// Page 2's rows keep counting through the header
		pressPageDown(container);
		await tick();
		resolvers.at(-1)!({ items: [{ name: "C" }, { name: "D" }] });
		await tick();

		expect(bodyRowIndexes(container)).toEqual(["4", "5"]);
	});
});

describe("DataGrid - Loading from a loader function", () => {
	it("shows a loading state, then renders rows and reports the total", async () => {
		let resolve!: (value: DataGridLoadEvent) => void;
		const load = () =>
			new Promise<DataGridLoadEvent>((r) => {
				resolve = r;
			});
		const onload = vi.fn();

		const container = mountGrid({
			columns: [{ key: "name" }],
			load,
			onload,
		});

		// While pending: no table yet, status region shown
		expect(queryByRole(container, "status")).toBeInTheDocument();
		expect(queryByRole(container, "grid")).not.toBeInTheDocument();

		resolve({ items: [{ name: "Alice" }, { name: "Bob" }], total: 42 });
		await tick();

		expect(queryByRole(container, "grid")).toBeInTheDocument();
		expect(queryByText(container, "Alice")).toBeInTheDocument();
		expect(onload).toHaveBeenCalledWith({ items: [{ name: "Alice" }, { name: "Bob" }], total: 42 });
	});

	it("sets aria-rowcount from the loader total", async () => {
		let resolve!: (value: DataGridLoadEvent) => void;
		const load = () =>
			new Promise<DataGridLoadEvent>((r) => {
				resolve = r;
			});
		const container = mountGrid({ columns: [{ key: "name" }], load });

		resolve({ items: [{ name: "Alice" }], total: 100 });
		await tick();

		// The total counts the header row (APG grid-and-table-properties)
		expect(queryByRole(container, "grid")).toHaveAttribute("aria-rowcount", "101");
		expect(container.querySelector("thead tr")).toHaveAttribute("aria-rowindex", "1");
		expect(container.querySelector("tbody tr")).toHaveAttribute("aria-rowindex", "2");
	});

	it("accepts loaders that return a bare array", async () => {
		let resolve!: (items: any[]) => void;
		const load = () =>
			new Promise<any[]>((r) => {
				resolve = r;
			});
		const onload = vi.fn();
		const container = mountGrid({ columns: [{ key: "name" }], load, onload });

		resolve([{ name: "Alice" }]);
		await tick();

		expect(queryByText(container, "Alice")).toBeInTheDocument();
		expect(onload).toHaveBeenCalledWith({ items: [{ name: "Alice" }] });
	});

	it("sets aria-busy and data-loading while a reload is pending", async () => {
		const resolvers: ((value: DataGridLoadEvent) => void)[] = [];
		const load = () =>
			new Promise<DataGridLoadEvent>((r) => {
				resolvers.push(r);
			});
		const onloadstart = vi.fn();
		const container = mountGrid({
			columns: [{ key: "name", label: "Name", sortable: true }],
			load,
			onloadstart,
		});

		// The first load is pending: onloadstart fired, table not shown yet
		expect(onloadstart).toHaveBeenCalledTimes(1);
		expect(queryByRole(container, "grid")).not.toBeInTheDocument();

		resolvers.shift()!({ items: [{ name: "Alice" }, { name: "Bob" }] });
		await tick();

		let table = queryByRole(container, "grid")!;
		expect(table).not.toHaveAttribute("aria-busy");
		expect(table).not.toHaveAttribute("data-loading");

		// A sort triggers a reload: stale rows stay visible under the flag
		await userEvent.click(queryByRole(container, "button", { name: "Name" })!);
		await tick();

		table = queryByRole(container, "grid")!;
		expect(onloadstart).toHaveBeenCalledTimes(2);
		expect(table).toHaveAttribute("aria-busy", "true");
		expect(table).toHaveAttribute("data-loading", "true");
		expect(queryByText(container, "Alice")).toBeInTheDocument();

		// Resolving the reload clears the flag and reports the result
		resolvers.shift()!({ items: [{ name: "Alice" }, { name: "Bob" }] });
		await tick();

		table = queryByRole(container, "grid")!;
		expect(table).not.toHaveAttribute("aria-busy");
		expect(table).not.toHaveAttribute("data-loading");
	});

	it("shows an error message when the load fails", async () => {
		let reject!: (err: Error) => void;
		const load = () =>
			new Promise<DataGridLoadEvent>((_, rj) => {
				reject = rj;
			});
		const container = mountGrid({ columns: [{ key: "name" }], load });

		reject(new Error("Network unavailable"));
		await tick();

		const alert = queryByRole(container, "alert");
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent("Network unavailable");
	});

	it("renders rows synchronously for static data without a loading state", () => {
		const container = mountGrid({ columns: [{ key: "name" }], data: [{ name: "Alice" }] });

		expect(queryByRole(container, "status")).not.toBeInTheDocument();
		expect(queryByText(container, "Alice")).toBeInTheDocument();
	});
});
