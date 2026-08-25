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
