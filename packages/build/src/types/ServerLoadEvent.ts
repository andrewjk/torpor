import CookieHelper from "../server/CookieHelper";
import HeaderHelper from "../server/HeaderHelper";
import type { RouteParamsOf } from "./ParseRouteParams";

/**
 * The event passed to server functions. Annotate with a route path to get
 * typed params, e.g. `ServerLoadEvent<"/posts/[id]">`.
 */
export default interface ServerLoadEvent<Route extends string | undefined = undefined> {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: RouteParamsOf<Route>;
	// TODO: Maybe we should find a better name for the data that is set set in
	// pages, and just call this data?
	/**
	 * Data that is available to functions in +server hooks, layouts, endpoints
	 * and pages. It flows down in that order.
	 */
	appData: Record<string, any>;
	/**
	 * The server request.
	 */
	request: Request;
	//response: ServerResponse;
	/**
	 * A helper for getting and setting cookie data.
	 */
	cookies: CookieHelper;
	/**
	 * A helper for getting and setting headers.
	 */
	headers: HeaderHelper;
	/**
	 * An optional adapter object, containing adapter-specific functionality.
	 */
	adapter: Record<PropertyKey, any>;
}
