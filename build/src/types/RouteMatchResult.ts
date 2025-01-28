import { type RouteHandler } from "./RouteHandler";

export type RouteMatchResult = {
	handler: RouteHandler;
	routeParams?: Record<string, string>;
	urlParams?: Record<string, string>;
};
