import response from "./response";

/**
 * 405 Method Not Allowed
 *
 * The HTTP 405 Method Not Allowed client error response status code indicates
 * that the server knows the request method, but the target resource doesn't
 * support this method. The server must generate an Allow header in a 405
 * response with a list of methods that the target resource currently supports.
 *
 * Improper server-side permissions set on files or directories may cause a 405
 * response when the request would otherwise be expected to succeed.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/405
 */
export default function methodNotAllowed(body?: object | string): Response {
	return response(405, body ?? "Method not allowed");
}
