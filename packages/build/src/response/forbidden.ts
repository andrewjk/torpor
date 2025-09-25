import response from "./response";

/**
 * 403 Forbidden
 *
 * The HTTP 403 Forbidden client error response status code indicates that the
 * server understood the request but refused to process it. This status is
 * similar to 401, except that for 403 Forbidden responses, authenticating or
 * re-authenticating makes no difference. The request failure is tied to
 * application logic, such as insufficient permissions to a resource or action.
 *
 * Clients that receive a 403 response should expect that repeating the request
 * without modification will fail with the same error. Server owners may decide
 * to send a 404 response instead of a 403 if acknowledging the existence of a
 * resource to clients with insufficient privileges is not desired.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403
 */
export default function forbidden(body?: object | string): Response {
	return response(403, body ?? "Forbidden");
}
