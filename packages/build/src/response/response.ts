import { type DeferredEntry, splitDeferred } from "../deferred";
import { INTERNAL_RESPONSE_BODY, INTERNAL_RESPONSE_DEFERRED } from "./internal";

/**
 * Creates a response with the supplied status code and optional body.
 *
 * If the body is an object, it will be converted to JSON and the Content-Type
 * header set to "application/json". Promise-valued properties are left out of
 * the JSON and kept on the Response (see `deferred.ts`), so a load can stream
 * them after the critical data. Otherwise, if the body is a string, the
 * Content-Type header will be set to "text/plain".
 */
export default function response(status: number, body?: object | string): Response {
	let headers: Record<string, string> | undefined = undefined;
	let originalBody: object | undefined;
	let deferred: DeferredEntry[] | undefined;
	if (body) {
		if (typeof body === "object") {
			const split = splitDeferred(body);
			originalBody = body;
			deferred = split.entries;
			headers = { "Content-Type": "application/json" };
			body = JSON.stringify(split.critical);
		} else {
			headers = { "Content-Type": "text/plain" };
		}
	}
	const result = new Response(body, {
		status,
		headers,
	}) as Response & {
		[INTERNAL_RESPONSE_BODY]?: object;
		[INTERNAL_RESPONSE_DEFERRED]?: DeferredEntry[];
	};
	if (originalBody !== undefined) {
		result[INTERNAL_RESPONSE_BODY] = originalBody;
	}
	if (deferred && deferred.length > 0) {
		result[INTERNAL_RESPONSE_DEFERRED] = deferred;
	}
	return result;
}
