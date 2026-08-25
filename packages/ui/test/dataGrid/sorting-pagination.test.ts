import { queryAllByRole, queryByRole, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import { DataGrid } from "../../src/DataGrid/index";
import type { DataColumn, LoadResult } from "../../src/DataGrid/index";
import LoaderGrid from "./components/LoaderGrid.torp";
import PagedGrid from "./components/PagedGrid.torp";
import userEvent from "@testing-library/user-event";

const tick = () => new Promise((r) => setTimeout(r));

function mountGrid(props: Record<string, any>): HTMLElement {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, DataGrid as any, props);
	return container;
}

function bodyColumn(container: HTMLElement, index: number): string[] {
	return Array.from(container.querySelectorAll(`tbody tr td:nth-child(${index + 1})`), (td) =>
		td.textContent!.trim(),
	);
}

describe("DataGrid - Sorting", () => {
	it("sorts static data on header click and toggles direction", async () => {
		const onsortchange = vi.fn();
		const columns: DataColumn[] = [
			{ key: "name", label: "Name", sortable: true },
			{ key: "age", label: "Age" },
		];
		const data = [
			{ name: "Cara", age: 31 },
			{ name: "Alice", age: 25 },
			{ name: "Bob", age: 28 },
		];
		const grid = mountGrid({ columns, data, onsortchange });

		await userEvent.click(queryByRole(grid, "button", { name: "Name" })!);

		expect(bodyColumn(grid, 0)).toEqual(["Alice", "Bob", "Cara"]);
		expect(onsortchange).toHaveBeenCalledWith("name", "asc");
		expect(queryByRole(grid, "columnheader", { name: "Name" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);

		await userEvent.click(queryByRole(grid, "button", { name: "Name" })!);

		expect(bodyColumn(grid, 0)).toEqual(["Cara", "Bob", "Alice"]);
		expect(onsortchange).toHaveBeenCalledWith("name", "desc");
		expect(queryByRole(grid, "columnheader", { name: "Name" })).toHaveAttribute(
			"aria-sort",
			"descending",
		);
	});

	it("clears aria-sort from other columns when sorting a new one", async () => {
		const columns: DataColumn[] = [
			{ key: "name", sortable: true },
			{ key: "age", sortable: true },
		];
		const data = [
			{ name: "Cara", age: 31 },
			{ name: "Alice", age: 25 },
		];
		const grid = mountGrid({ columns, data });

		await userEvent.click(queryByRole(grid, "button", { name: "name" })!);
		await userEvent.click(queryByRole(grid, "button", { name: "age" })!);

		expect(queryByRole(grid, "columnheader", { name: "name" })).not.toHaveAttribute("aria-sort");
		expect(queryByRole(grid, "columnheader", { name: "age" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
	});

	it("sorts numbers numerically via getValue", async () => {
		const columns: DataColumn[] = [
			{
				key: "score",
				label: "Score",
				sortable: true,
				getValue: (row: any) => row.score,
			},
		];
		const data = [{ score: 10 }, { score: 2 }, { score: 33 }];
		const grid = mountGrid({ columns, data });

		await userEvent.click(queryByRole(grid, "button", { name: "Score" })!);

		expect(bodyColumn(grid, 0)).toEqual(["2", "10", "33"]);
	});

	it("passes sort fields to the loader request", async () => {
		const requests: any[] = [];
		let resolve!: (value: LoadResult) => void;
		const load = (request: any) =>
			new Promise<LoadResult>((r) => {
				requests.push(request);
				resolve = r;
			});
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderGrid as any, { load });

		resolve({ items: [] });
		await tick();

		await userEvent.click(queryByRole(container, "button", { name: "Name" })!);
		await tick();

		expect(requests.at(-1)).toMatchObject({ sortBy: "name", sortDirection: "asc" });
	});
});

describe("DataGrid - Pagination", () => {
	it("slices static data by page and pageSize", () => {
		const columns = [{ key: "name", label: "Name" }];
		const data = ["A", "B", "C", "D", "E"].map((name) => ({ name }));

		const page1 = mountGrid({ columns, data, pageSize: 2, page: 1 });
		const page3 = mountGrid({ columns, data, pageSize: 2, page: 3 });

		expect(bodyColumn(page1, 0)).toEqual(["A", "B"]);
		expect(bodyColumn(page3, 0)).toEqual(["E"]);
	});

	it("updates the visible slice when the bound page changes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PagedGrid);

		expect(bodyColumn(container, 0)).toEqual(["A", "B"]);

		await userEvent.click(queryByText(container, "next page")!);
		await tick();

		expect(bodyColumn(container, 0)).toEqual(["C", "D"]);
	});

	it("passes page and pageSize to the loader request", async () => {
		const requests: any[] = [];
		let resolve!: (value: LoadResult) => void;
		const load = (request: any) =>
			new Promise<LoadResult>((r) => {
				requests.push(request);
				resolve = r;
			});
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderGrid as any, { load, pageSize: 5 });

		resolve({ items: [], total: 12 });
		await tick();

		expect(requests[0]).toEqual({ page: 1, pageSize: 5 });
	});

	it("shows the empty message when the page is out of range", () => {
		const columns = [{ key: "name" }];
		const grid = mountGrid({
			columns,
			data: [{ name: "A" }],
			pageSize: 2,
			page: 5,
		});

		expect(queryAllByRole(grid, "gridcell")).toHaveLength(0);
		expect(queryByText(grid, "No results.")).toBeInTheDocument();
	});
});
