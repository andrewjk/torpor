import ServerEvent from "./ServerEvent";

/**
 * For +page.server.
 */
export default interface PageServerEndPoint {
	/**
	 * Loads data from the server for a page.
	 */
	load?: ServerLoad;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: Record<string, ServerAction>;
}

type ServerLoad = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
type ServerAction = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
