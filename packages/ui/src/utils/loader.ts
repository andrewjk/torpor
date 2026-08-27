import { $async, $watch } from "@torpor/view";

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

export interface ItemLoaderOptions<T = any, TRequest extends LoadRequest = LoadRequest> {
	/** The loader function to fetch items */
	load: Loader<T, TRequest>;
	/**
	 * Builds the request for the current fetch. Called inside the async
	 * getter, so reads of reactive state here re-fetch when they change.
	 */
	getRequest: () => TRequest;
	/** Called after each successful load with the normalized result */
	onload?: (result: LoadResult<T>) => void;
}

/** Reactive loading state returned by createItemLoader */
export interface ItemLoaderState<T = any> {
	/** The full result of the current load; suspends while a fetch is pending */
	readonly result: LoadResult<T> | undefined;
	/** The loaded items; suspends while a fetch is pending */
	readonly items: T[];
}

/**
 * Shared loading state for components that read items from a network loader
 * (DataGrid, ComboBox auto-complete etc). Read the returned state's `items`
 * or `result` inside an `@await` boundary: while a fetch is pending the read
 * suspends, and when dependencies read inside `getRequest` change the fetch
 * re-runs.
 *
 * For lazy loading (fetch only once some condition is met), gate the whole
 * rendering of the region that reads this loader behind that condition
 * (`@if`), so the `@await` boundary -- and with it the first fetch --
 * comes into existence when the condition flips.
 *
 * ```
 * let $load = createItemLoader({
 * 	load: $props.load,
 * 	getRequest: () => ({ searchText: $state.searchText }),
 * });
 * @await { ...$load.items... } with { <span>Loading…</span> }
 * ```
 */
export function createItemLoader<T = any, TRequest extends LoadRequest = LoadRequest>(
	options: ItemLoaderOptions<T, TRequest>,
): ItemLoaderState<T> {
	return $watch({
		get result(): LoadResult<T> | undefined {
			return $async(() => {
				const promise = Promise.resolve(options.load(options.getRequest())).then(
					normalizeLoadResult,
				);
				// Report successful loads to the consumer; failures surface
				// through the component's error boundary, not this chain
				promise.then(
					(r) => options.onload?.(r),
					() => {},
				);
				return promise as Promise<LoadResult<T>>;
			});
		},
		get items(): T[] {
			return this.result?.items ?? [];
		},
	});
}
