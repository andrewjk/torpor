import type { DeferredEntry } from "../deferred";

/**
 * The body an endpoint passed to `response()`/`ok()`, before JSON
 * serialization. Server code reads deferred promises from it without parsing
 * the serialized copy.
 */
export const INTERNAL_RESPONSE_BODY: unique symbol = Symbol.for("torpor.response.body");

/** The deferred (promise-valued) properties split out of the response body. */
export const INTERNAL_RESPONSE_DEFERRED: unique symbol = Symbol.for("torpor.response.deferred");

export type ResponseWithBody = Response & {
	[INTERNAL_RESPONSE_BODY]?: object;
	[INTERNAL_RESPONSE_DEFERRED]?: DeferredEntry[];
};
