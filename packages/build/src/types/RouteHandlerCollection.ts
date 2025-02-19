import type RouteHandler from "./RouteHandler";
import type RouteMatchResult from "./RouteMatchResult";

type RouteHandlerCollection = {
	handlers: RouteHandler[];
	match(path: string, urlParams?: URLSearchParams): RouteMatchResult | undefined;
};
export default RouteHandlerCollection;
