import type TypedResponse from "../response/TypedResponse";
import type { UntypedResponse } from "../response/TypedResponse";

/**
 * What a load function may return. When `Data` is provided, a typed response
 * (e.g. `ok({ ... })`) must only contain keys the page expects; untyped
 * responses (redirects, errors, plain text) are always allowed.
 */
export type PageLoadReturn<Data> = TypedResponse<Partial<Data>> | UntypedResponse | undefined | void;
