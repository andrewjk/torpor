import ServerEvent from "./ServerEvent";

/**
 * For _hook.server.
 */
export default interface ServerHook {
	/**
	 * Called on each server request.
	 */
	handle?: ServerLoad;
}

type ServerLoad = (event: ServerEvent) => Promise<void> | void;
