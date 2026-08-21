/**
 * Extracts the params object from a route path string.
 *
 * Dynamic segments (`[id]`) and splat segments (`[...path]`) become string
 * properties; static segments are ignored. For example:
 *
 * ```ts
 * type Params = ParseRouteParams<"/posts/[id]/comments/[commentId]">;
 * // { id: string; commentId: string }
 * ```
 */
export type ParseRouteParams<Route extends string> = ParseSegments<Route, unknown>;

type ParseSegments<Route extends string, Params> = Route extends `${infer Head}/${infer Rest}`
	? ParseSegments<Rest, ParseSegment<Head, Params>>
	: ParseSegment<Route, Params>;

type ParseSegment<Segment extends string, Params> = Segment extends `[...${infer Name}]`
	? Params & { [Key in Name]: string }
	: Segment extends `[${infer Name}]`
		? Params & { [Key in Name]: string }
		: Params;

/**
 * Resolves the params for a route annotation: the parsed params for a literal
 * route path, or a loose record when no route (or a non-literal string) is
 * given.
 */
export type RouteParamsOf<Route extends string | undefined> = string extends Route
	? Record<string, string>
	: Route extends string
		? ParseRouteParams<Route>
		: Record<string, string>;

/**
 * Validates an inferred params object against a route's params shape:
 * resolves to the params type when its keys are exactly the route's keys, and
 * `never` when keys are missing or extra — so wrong keys error at the call
 * site (excess property checks are skipped for deferred conditional rest
 * tuples, but assignability to `never` can't be).
 */
export type ExactRouteParams<Params, Shape> = Params extends Shape
	? [Exclude<keyof Params, keyof Shape>] extends [never]
		? Params
		: never
	: never;

/**
 * The arguments for building a route path: nothing for static routes, or the
 * route's params object for dynamic routes.
 */
export type RouteArgs<Route extends string> = string extends Route
	? [params?: Record<string, string>]
	: keyof ParseRouteParams<Route> extends never
		? []
		: [params: ParseRouteParams<Route>];

/**
 * RouteArgs for an optional route annotation, defaulting to a single optional
 * loose params object.
 */
export type RouteArgsOf<Route extends string | undefined> = Route extends string
	? RouteArgs<Route>
	: [params?: Record<string, string>];
