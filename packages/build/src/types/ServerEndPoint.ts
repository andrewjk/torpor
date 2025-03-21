import type ServerRequest from "./ServerRequest";

/**
 * For +server.
 */
type ServerEndPoint = { [key: string]: ServerRequest } & {
	/**
	 * Performs a GET.
	 */
	get?: ServerRequest;
	/**
	 * Performs a POST.
	 */
	post?: ServerRequest;
	/**
	 * Performs a PATCH.
	 */
	patch?: ServerRequest;
	/**
	 * Performs a PUT.
	 */
	put?: ServerRequest;
	/**
	 * Performs a DELETE.
	 */
	del?: ServerRequest;
	/**
	 * Performs an OPTIONS request.
	 */
	options?: ServerRequest;
	/**
	 * Performs a HEAD request.
	 */
	head?: ServerRequest;
};

export default ServerEndPoint;
