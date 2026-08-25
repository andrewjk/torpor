import { queryAllByRole, queryByRole, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import { DataGrid } from "../../src/DataGrid/index";
import type { DataColumn, LoadResult } from "../../src/DataGrid/index";
import LoaderGrid from "./components/LoaderGrid.torp";
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
		expect(grid).not.toHaveAttribute("aria-rowcount");
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

	it("shows the empty slot when there are no rows", async () => {
		let resolve!: (value: LoadResult) => void;
		const load = () =>
			new Promise<LoadResult>((r) => {
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

describe("DataGrid - Loading from a loader function", () => {
	it("shows a loading state, then renders rows and reports the total", async () => {
		let resolve!: (value: LoadResult) => void;
		const load = () =>
			new Promise<LoadResult>((r) => {
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
		let resolve!: (value: LoadResult) => void;
		const load = () =>
			new Promise<LoadResult>((r) => {
				resolve = r;
			});
		const container = mountGrid({ columns: [{ key: "name" }], load });

		resolve({ items: [{ name: "Alice" }], total: 100 });
		await tick();

		expect(queryByRole(container, "grid")).toHaveAttribute("aria-rowcount", "100");
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

	it("shows an error message when the load fails", async () => {
		let reject!: (err: Error) => void;
		const load = () =>
			new Promise<LoadResult>((_, rj) => {
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
