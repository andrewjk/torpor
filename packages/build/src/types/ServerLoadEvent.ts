import CookieHelper from "./CookieHelper";

type ServerLoadEvent = {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: Record<string, string>;
	// TODO: Maybe we should find a better name for the data that is set set in
	// pages, and just call this data?
	/**
	 * Data that is available to functions in +server hooks, layouts, endpoints
	 * and pages. It flows down in that order.
	 */
	appData: Record<string, any>;
	/**
	 * The server request.
	 */
	request: Request;
	//response: ServerResponse;
	/**
	 * A helper for getting and setting cookie data.
	 */
	cookies: CookieHelper;
};

export default ServerLoadEvent;
