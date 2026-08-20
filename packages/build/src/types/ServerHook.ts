import type ServerLoadEvent from "./ServerLoadEvent";

/**
 * For _hook.server.
 */
export default interface ServerHook<Route extends string | undefined = undefined> {
	/**
	 * Called on each server request.
	 */
	handle?: (event: ServerLoadEvent<Route>) => Promise<void> | void;
}
