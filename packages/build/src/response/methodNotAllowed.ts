import response from "./response";

/**
 * 405 Method Not Allowed
 *
 * The request method is known by the server but is not supported by the target
 * resource. For example, an API may not allow calling DELETE to remove a
 * resource.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
 */
export default function methodNotAllowed(body?: object | string): Response {
	return response(405, body ?? "Method not allowed");
}
