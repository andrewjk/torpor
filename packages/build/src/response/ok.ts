import response from "./response";

/**
 * 200 OK
 *
 * The HTTP 200 OK successful response status code indicates that a request has
 * succeeded. A 200 OK response is cacheable by default.
 *
 * A 200 OK response has a different meaning and format depending on the HTTP
 * request method. Here's how they vary for different methods:
 *
 * - GET: A resource was retrieved by the server and included in the response
 *   body.
 * - POST: An action succeeded; the response has a message body describing the
 *   result.
 * - HEAD: Identical to GET, except there is no message body.
 * - TRACE: The response has a message body containing the request as received
 *   by the server.
 *
 * Although possible, successful PUT or DELETE requests often do not result in a
 * 200 OK response. It is more common to see 201 Created if the resource is
 * uploaded or created for the first time, or 204 No Content upon successful
 * deletion of a resource.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200
 */
export default function ok(body?: object | string): Response {
	return response(200, body);
}
