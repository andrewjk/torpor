import { type RouteType } from "./RouteType";

/**
 * A route that is added to the Site.
 */
export default interface Route {
	path: string;
	file: string;
	type: RouteType;
	subFolder?: string;
}
