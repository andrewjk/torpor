import type PageServerAction from "./PageServerAction";
import type PageServerLoad from "./PageServerLoad";

/**
 * For +page.server. Annotate with a route path to get typed params, e.g.
 * `PageServerEndPoint<"/posts/[id]">`.
 */
export default interface PageServerEndPoint<Route extends string | undefined = undefined> {
	/**
	 * Loads data from the server for a page.
	 */
	load?: PageServerLoad<Route>;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: Record<string, PageServerAction<Route>>;
}
