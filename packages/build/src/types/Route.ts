import type PageServerEndPoint from "./PageServerEndPoint";
import { type RouteType } from "./RouteType";

/**
 * A route that is added to the Site.
 */
export default interface Route {
	path: string;
	/**
	 * The file for this route, relative to the site root. Omitted for inline
	 * endpoints (see `endPoint`).
	 */
	file?: string;
	/**
	 * For inline routes (defined in code rather than by file), the endpoint
	 * object itself.
	 */
	endPoint?: PageServerEndPoint;
	type: RouteType;
	subFolder?: string;
}
