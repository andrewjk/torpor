import { INTERNAL_RESPONSE_BODY } from "./internal";

/**
 * The object an endpoint passed to `response()`/`ok()`, including any
 * promise-valued properties, or `undefined` for a direct `Response.json` (or
 * a non-object body).
 */
export function rawResponseBody(response: Response): Record<string, any> | undefined {
	const body = (response as Response & { [INTERNAL_RESPONSE_BODY]?: unknown })[
		INTERNAL_RESPONSE_BODY
	];
	return body !== null && typeof body === "object" ? (body as Record<string, any>) : undefined;
}

/**
 * Reads a load response's data: the original object when the endpoint used
 * `ok()`/`response()` (so deferred promises survive), otherwise its JSON body.
 */
export async function readResponseBody(
	response: Response | undefined,
): Promise<Record<string, any> | undefined> {
	if (!response) return undefined;
	const raw = rawResponseBody(response);
	if (raw !== undefined) return raw;
	if (response.headers.get("Content-Type")?.includes("application/json")) {
		return (await response.json()) as Record<string, any>;
	}
	return undefined;
}
