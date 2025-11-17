import type RouteLayoutHandler from "./RouteLayoutHandler";

/**
 * A handler for a route in the Router.
 */
export default interface RouteHandler {
	path: string;
	type: number;
	endPoint: () => Promise<any>;
	subFolder?: string;

	loaded?: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: () => Promise<any>;
	serverHook?: () => Promise<any>;
}
