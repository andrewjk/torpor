import response from "./response";

/**
 * 401 Unauthorized
 *
 * The HTTP 401 Unauthorized client error response status code indicates that a
 * request was not successful because it lacks valid authentication credentials
 * for the requested resource. This status code is sent with an HTTP
 * WWW-Authenticate response header that contains information on the
 * authentication scheme the server expects the client to include to make the
 * request successfully.
 *
 * A 401 Unauthorized is similar to the 403 Forbidden response, except that a
 * 403 is returned when a request contains valid credentials, but the client
 * does not have permissions to perform a certain action.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401
 */
export default function unauthorized(body?: object | string): Response {
	return response(401, body ?? "Unauthorized");
}
