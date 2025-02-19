import type ServerEvent from "./ServerEvent";

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

type ServerLoad = (event: ServerEvent) => Promise<void> | void;
