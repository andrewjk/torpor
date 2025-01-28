import { type RouteHandler } from "./RouteHandler";
import { type RouteMatchResult } from "./RouteMatchResult";

export type RouteHandlerCollection = {
	handlers: RouteHandler[];
	match(path: string, urlParams?: URLSearchParams): RouteMatchResult | undefined;
};
