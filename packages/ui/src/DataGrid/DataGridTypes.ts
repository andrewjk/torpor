import type { LoadResult } from "../utils/loader";

/** A column in a DataGrid */
export interface DataColumn<T = any> {
	/** The field name to read from each row (or pass a `getValue` function) */
	key: string;
	/** Header text; defaults to the key */
	label?: string;
	/** Cell content alignment */
	align?: "start" | "center" | "end";
	/** Whether clicking this column's header sorts by it */
	sortable?: boolean;
	/** Extracts the cell value from a row; defaults to `row[key]` */
	getValue?: (row: T) => any;
}

/** What a DataGrid passes to its cell slot for custom rendering */
export interface DataGridCellSlot<T = any> {
	row: T;
	column: DataColumn<T>;
	value: any;
}

/** Data passed to the `onload` callback after each successful load */
export type DataGridLoadEvent<T = any> = LoadResult<T>;

export const DataGridContextName: unique symbol = Symbol.for("torp.DataGrid");

export interface DataGridContext {
	/** Sorts by a column, toggling the direction when already sorted by it */
	toggleSort: (column: DataColumn) => void;
	/** The aria-sort value for a column header */
	getAriaSort: (key: string) => "ascending" | "descending" | undefined;
	/** The alignment class for a column */
	getAlignClass: (align: "start" | "center" | "end" | undefined) => string | undefined;
	/** Extracts a cell's value from its row */
	getCellValue: (row: any, column: DataColumn) => any;
	/** Whether a cell is the single tab stop (roving tabindex) */
	isActiveCell: (row: number, col: number) => boolean;
	/** The data-cell ID for a cell */
	getCellId: (row: number, col: number) => string;
}
