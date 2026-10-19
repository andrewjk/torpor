import type TypedResponse from "../response/TypedResponse";
import type { UntypedResponse } from "../response/TypedResponse";

/**
 * What a load function may return. When `Data` is provided, a typed response
 * (e.g. `ok({ ... })`) must only contain keys the page expects; untyped
 * responses (redirects, errors, plain text) are always allowed.
 *
 * Promise-valued properties are deferred: the page renders once the awaited
 * values are ready, and the promises resolve (streaming from the server) after
 * it mounts. Annotate `Data` with the shape the page sees, e.g.
 * `{ post: Post; comments: Promise<Comment[]> }`.
 */
export type PageLoadReturn<Data> =
	| TypedResponse<Partial<Data>>
	| UntypedResponse
	| undefined
	| void;
