import type ServerLoadEvent from "./ServerLoadEvent";

/**
 * For _hook.server.
 */
type ServerHook = {
	/**
	 * Called on each server request.
	 */
	handle?: ServerLoad;
};

export default ServerHook;

type ServerLoad = (event: ServerLoadEvent) => Promise<void> | void;
