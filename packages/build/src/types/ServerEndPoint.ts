import type ServerRequest from "./ServerRequest";

/**
 * For +server. Annotate with a route path to get typed params, e.g.
 * `ServerEndPoint<"/api/posts/[id]">`.
 */
type ServerEndPoint<Route extends string | undefined = undefined> = {
	[key: string]: ServerRequest<Route>;
} & {
	/**
	 * Performs a GET.
	 */
	get?: ServerRequest<Route>;
	/**
	 * Performs a POST.
	 */
	post?: ServerRequest<Route>;
	/**
	 * Performs a PATCH.
	 */
	patch?: ServerRequest<Route>;
	/**
	 * Performs a PUT.
	 */
	put?: ServerRequest<Route>;
	/**
	 * Performs a DELETE.
	 */
	del?: ServerRequest<Route>;
	/**
	 * Performs an OPTIONS request.
	 */
	options?: ServerRequest<Route>;
	/**
	 * Performs a HEAD request.
	 */
	head?: ServerRequest<Route>;
};

export default ServerEndPoint;
