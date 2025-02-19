import type RouteHandler from "./RouteHandler";

type RouteMatchResult = {
	handler: RouteHandler;
	routeParams?: Record<string, string>;
	urlParams?: Record<string, string>;
};
export default RouteMatchResult;
