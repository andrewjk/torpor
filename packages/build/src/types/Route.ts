import type PageEndPoint from "./PageEndPoint";
import type PageServerEndPoint from "./PageServerEndPoint";
import type ServerEndPoint from "./ServerEndPoint";
import type ServerHook from "./ServerHook";
import { type RouteType } from "./RouteType";

/**
 * Any endpoint shape that can be stored inline on a Route.
 */
export type InlineEndPoint = PageServerEndPoint | ServerEndPoint | ServerHook | PageEndPoint;

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
	 * object itself. The shape depends on the route type
	 * (`PageServerEndPoint`, `ServerEndPoint`, `ServerHook`, etc.).
	 */
	endPoint?: InlineEndPoint;
	type: RouteType;
	subFolder?: string;
}
