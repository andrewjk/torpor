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

/**
 * The merged page data for a page that sits under one or more layouts: pass
 * the layout endpoints first and the page endpoint last, e.g.
 *
 * ```ts
 * import type layoutServer from "../_layout.server";
 * import type server from "./+page.server";
 * type Data = MergePageData<typeof layoutServer, typeof server>;
 * ```
 *
 * Each endpoint's data is intersected in order; endpoints without a typed
 * `load` contribute nothing but looseness.
 */
export type MergePageData<EndPoints extends any[]> = EndPoints extends [
	infer First,
	...infer Rest,
]
	? PageData<First> & MergePageData<Rest>
	: unknown;
