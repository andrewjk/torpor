import type { QueryRecord } from "../types/ServerLoadEvent";

/**
 * Converts a URL's query string into a plain record: one string per param,
 * or an array when a param was repeated.
 *
 * @param searchParams The URL's search params
 * @returns The param values
 */
export default function searchParamsToRecord(searchParams: URLSearchParams): QueryRecord {
	const result: QueryRecord = {};
	for (const key of searchParams.keys()) {
		if (key in result) continue;
		const values = searchParams.getAll(key);
		result[key] = values.length > 1 ? values : values[0];
	}
	return result;
}
