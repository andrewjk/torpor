import type { RouteParamsOf } from "./ParseRouteParams";

/**
 * The event passed to client load functions. Annotate with a route path to get
 * typed params, e.g. `PageLoadEvent<"/posts/[id]">`.
 */
export default interface PageLoadEvent<Route extends string | undefined = undefined> {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: RouteParamsOf<Route>;
	/**
	 * Data that is (optionally) loaded from the load function and passed into the page as $props.data.
	 */
	data: Record<string, any>;
}
