import type RouteHandler from "./RouteHandler";

type RouteMatchResult = {
	handler: RouteHandler;
	params?: Record<string, string>;
	query?: Record<string, string>;
};

export default RouteMatchResult;
