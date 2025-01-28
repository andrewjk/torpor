import { type ServerEvent } from "./ServerEvent";

/**
 * For +server.
 */
export type ServerEndPoint = { [key: string]: ServerRequest } & {
	/**
	 * Performs a GET.
	 */
	get?: ServerRequest;
	/**
	 * Perfroms a POST.
	 */
	post?: ServerRequest;
	/**
	 * Perfroms a PATCH.
	 */
	patch?: ServerRequest;
	/**
	 * Perfroms a PUT.
	 */
	put?: ServerRequest;
	/**
	 * Perfroms a DELETE.
	 */
	del?: ServerRequest;
	/**
	 * Perfroms an OPTIONS request.
	 */
	options?: ServerRequest;
	/**
	 * Perfroms a HEAD request.
	 */
	head?: ServerRequest;
};

type ServerRequest = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
