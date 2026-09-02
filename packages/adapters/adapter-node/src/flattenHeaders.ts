import { IncomingHttpHeaders } from "node:http";
import { OutgoingHttpHeaders } from "node:http2";

/**
 * Flattens raw node request headers into a `HeadersInit`. Returning plain
 * tuples (rather than a `Headers` instance) means the Request constructor
 * walks them once instead of copying from a Headers into another Headers.
 */
export default function flattenHeaders(
	headers: IncomingHttpHeaders | OutgoingHttpHeaders,
): HeadersInit {
	const flatHeaders: [string, string][] = [];
	for (const [key, value] of Object.entries(headers)) {
		if (value === undefined || value === null) {
			continue;
		} else if (Array.isArray(value)) {
			for (const v of value) {
				if (v !== undefined && v !== null) {
					flatHeaders.push([key, String(v)]);
				}
			}
		} else {
			flatHeaders.push([key, String(value)]);
		}
	}
	return flatHeaders;
}
