import type { RouteParamsOf } from "./ParseRouteParams";

/**
 * The event passed to client load functions. Annotate with a route path to
 * get typed params, e.g. `PageLoadEvent<"/posts/[id]">`, and with a data type
 * to type the data accumulated from the layouts above, e.g.
 * `PageLoadEvent<"/posts/[id]", PageData<typeof layoutServer>>`.
 */
export default interface PageLoadEvent<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
> {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: RouteParamsOf<Route>;
	/**
	 * Data loaded by the layouts above, accumulated top down. Loads may add to
	 * it, and the merged result is passed into the page as `$props.data`.
	 */
	data: Data;
}
