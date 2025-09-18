import type PageServerAction from "./PageServerAction";
import type PageServerLoad from "./PageServerLoad";

/**
 * For +page.server.
 */
export default interface PageServerEndPoint {
	/**
	 * Loads data from the server for a page.
	 */
	load?: PageServerLoad;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: Record<string, PageServerAction>;
}
