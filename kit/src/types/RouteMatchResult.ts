import type RouteHandler from "./RouteHandler";

export default interface RouteMatchResult {
	handler: RouteHandler;
	routeParams?: Record<PropertyKey, string>;
	urlParams?: Record<PropertyKey, string>;
}
