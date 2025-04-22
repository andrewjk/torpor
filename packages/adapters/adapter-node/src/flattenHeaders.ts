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
					value.forEach((v) => flatHeaders.append(key, v));
				}
			}
		} else {
			flatHeaders.set(key, String(value));
		}
	}
	return flatHeaders;

	/*
            const flatHeaders: [string, string][] = [];

	for (const [key, value] of Object.entries(headers)) {
		if (value === undefined || value === null) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const v of value) {
				if (v != null) {
					flatHeaders.push([key, String(v)]);
				}
			}
		} else {
			flatHeaders.push([key, String(value)]);
		}
	}

	return flatHeaders;
    */
}
