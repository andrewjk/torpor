import type TypedResponse from "../response/TypedResponse";

/**
 * The page data produced by an endpoint's `load` function, e.g.
 *
 * ```ts
 * import type server from "./+page.server";
 * type Data = PageData<typeof server>;
 * ```
 *
 * Falls back to a loose record when the endpoint has no load or its load
 * returns untyped responses.
 */
export type PageData<EndPoint> = EndPoint extends { load?: (event: any) => infer Return }
	? NonNullable<Awaited<Return>> extends TypedResponse<infer Body>
		? Body
		: Record<string, any>
	: Record<string, any>;
