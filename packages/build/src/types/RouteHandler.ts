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

	// The endpoint module and the resolved server hooks are cached on the
	// handler after first use, so warm requests don't pay for the loaders
	modulePromise?: Promise<any>;
	resolvedModule?: any;
	resolvedHooks?: Promise<ServerHook[]>;
}
