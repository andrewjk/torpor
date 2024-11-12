import response from "./response";

/**
 * 403 Forbidden
 *
 * The client does not have access rights to the content; that is, it is
 * unauthorized, so the server is refusing to give the requested resource.
 * Unlike 401 Unauthorized, the client's identity is known to the server.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
 */
export default function forbidden(body?: object | string): Response {
	return response(403, body);
}
