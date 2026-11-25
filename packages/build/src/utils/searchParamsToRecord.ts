import type { QueryRecord } from "../types/ServerLoadEvent";

/**
 * Converts a URL's query string into a plain record: one string per param,
 * or an array when a param was repeated.
 *
 * @param searchParams The URL's search params
 * @returns The param values
 */
export default function searchParamsToRecord(searchParams: URLSearchParams): QueryRecord {
	// A null-prototype record so param names like `__proto__`, `constructor`
	// or `toString` are stored as data (and `__proto__` can't pollute the
	// prototype) instead of being skipped by an inherited-property check
	const result = Object.create(null) as QueryRecord;
	for (const key of searchParams.keys()) {
		if (Object.hasOwn(result, key)) continue;
		const values = searchParams.getAll(key);
		result[key] = values.length > 1 ? values : values[0];
	}
	return result;
}
