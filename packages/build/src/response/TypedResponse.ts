/**
 * A Response whose JSON body type is known, as returned by e.g. `ok({ ... })`.
 * Purely a compile-time marker: it is assignable to and from Response at
 * runtime.
 */
export default interface TypedResponse<T> extends Response {
	/**
	 * Phantom property carrying the body type. Never set at runtime.
	 */
	readonly __body?: T;
}
