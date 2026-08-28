import type ServerLoadEvent from "./ServerLoadEvent";

/**
 * For _hook.server.
 */
export default interface ServerHook<Route extends string | undefined = undefined> {
	/**
	 * Called before each server request is handled. Return a Response to
	 * short-circuit the request, skipping the load, action or view rendering
	 * (e.g. a redirect for unauthenticated users).
	 */
	enter?: (event: ServerLoadEvent<Route>) => Promise<Response | void> | Response | void;
	/**
	 * Called after the request has been handled, even if the handler threw
	 * an error or the enter hook short-circuited it.
	 */
	exit?: (event: ServerLoadEvent<Route>) => Promise<void> | void;
}
