import type EndPointHandler from "./EndPointHandler";

type RouteMatchResult = {
	handler: EndPointHandler;
	params?: Record<string, string>;
	query?: Record<string, string>;
};

export default RouteMatchResult;
