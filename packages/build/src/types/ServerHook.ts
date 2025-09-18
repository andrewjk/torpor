import type ServerLoadEvent from "./ServerLoadEvent";

/**
 * For _hook.server.
 */
export default interface ServerHook {
	/**
	 * Called on each server request.
	 */
	handle?: (event: ServerLoadEvent) => Promise<void> | void;
}
