import type RouteHandler from "./RouteHandler";

export default interface RouteMatchResult {
	handler: RouteHandler;
	routeParams?: Record<string, string>;
	urlParams?: Record<string, string>;
}
