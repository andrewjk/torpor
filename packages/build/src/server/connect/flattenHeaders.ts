import { IncomingHttpHeaders } from "node:http";
import { OutgoingHttpHeaders } from "node:http2";

export default function flattenHeaders(
	headers: IncomingHttpHeaders | OutgoingHttpHeaders,
): HeadersInit {
	const flatHeaders = new Headers();
	for (const [key, value] of Object.entries(headers)) {
		if (value === undefined || value === null) {
			continue;
		} else if (Array.isArray(value)) {
			for (const v of value) {
				if (v !== undefined && v !== null) {
					flatHeaders.append(key, String(v));
				}
			}
		} else {
			flatHeaders.set(key, String(value));
		}
	}
	return flatHeaders;
}
