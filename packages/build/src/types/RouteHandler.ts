import type RouteLayoutHandler from "./RouteLayoutHandler";
import type ServerHook from "./ServerHook";

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
	serverHooks?: (() => Promise<any>)[];

	// The endpoint module, the sibling server endpoint module and the resolved
	// server hooks are cached on the handler after first use, so warm requests
	// don't pay for the loaders. The resolved *values* are cached, never the
	// loader promises: on workerd, a promise created by a request that ends
	// before it settles can never settle, so a cached promise would fail every
	// later request for the route
	resolvedModule?: any;
	resolvedServerModule?: any;
	resolvedHooks?: ServerHook[];
}
