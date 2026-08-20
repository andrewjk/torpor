import type PageServerAction from "./PageServerAction";
import type PageServerLoad from "./PageServerLoad";

/**
 * For +page.server. Annotate with a route path to get typed params, and with
 * a data shape to flag loads that return keys the page doesn't expect, e.g.
 * `PageServerEndPoint<"/posts/[id]", { posts: Post[] }>`.
 */
export default interface PageServerEndPoint<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
> {
	/**
	 * Loads data from the server for a page.
	 */
	load?: PageServerLoad<Route, Data>;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: Record<string, PageServerAction<Route>>;
}
