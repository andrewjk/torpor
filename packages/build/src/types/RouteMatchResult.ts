import type RouteHandler from "./RouteHandler";

export default interface RouteMatchResult {
	handler: RouteHandler;
	params?: Record<string, string>;
	query?: Record<string, string>;
}
