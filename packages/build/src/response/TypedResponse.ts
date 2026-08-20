/**
 * A Response whose JSON body type is known, as returned by e.g. `ok({ ... })`.
 * Purely a compile-time marker: `__body` is never set at runtime.
 */
export default interface TypedResponse<T> extends Response {
	/**
	 * Phantom property carrying the body type. Required so that plain
	 * `Response` values do not match `TypedResponse<infer T>`.
	 */
	readonly __body: T;
}

/**
 * A Response that does not carry typed JSON data (e.g. redirects, errors,
 * plain-text bodies). Loads may return these alongside typed data responses.
 */
export type UntypedResponse = Response & { readonly __body?: never };
