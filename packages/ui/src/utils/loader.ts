/**
 * Shared contract for loading data from the network, used by components that
 * can take either static data or a loader function (DataGrid now, ComboBox
 * auto-complete and others later).
 *
 * A loader receives a request object describing what to fetch -- paging,
 * search text and sorting are standard; components extend it with their own
 * fields -- plus an AbortSignal so stale requests can be cancelled.
 */

/** The base shape of a load request. Components extend this with their own fields. */
export interface LoadRequest {
	/** 1-based page number to load */
	page?: number;
	/** Number of items per page */
	pageSize?: number;
	/** Search or filter text entered by the user */
	searchText?: string;
	/** The field to sort by */
	sortBy?: string;
	/** The direction to sort in */
	sortDirection?: "asc" | "desc";
}

/**
 * The result of a load: the items for the current request, and optionally
 * the total count (needed for paged components to show a pager).
 */
export interface LoadResult<T = any> {
	items: T[];
	/** The total number of items across all pages, if known */
	total?: number;
}

/**
 * Reads data for a request. May return a promise or a plain result, and may
 * return just an array of items when no total is available.
 */
export type Loader<T = any, TRequest extends LoadRequest = LoadRequest> = (
	request: TRequest,
	signal?: AbortSignal,
) => Promise<LoadResult<T> | T[]> | LoadResult<T> | T[];

/** Wraps a bare array in a LoadResult so consumers always get the same shape */
export function normalizeLoadResult<T>(result: LoadResult<T> | T[]): LoadResult<T> {
	return Array.isArray(result) ? { items: result } : result;
}
