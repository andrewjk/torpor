import response from "./response";

/**
 * 400 Bad Request
 *
 * The HTTP 400 Bad Request client error response status code indicates that the
 * server would not process the request due to something the server considered
 * to be a client error. The reason for a 400 response is typically due to
 * malformed request syntax, invalid request message framing, or deceptive
 * request routing.
 *
 * Clients that receive a 400 response should expect that repeating the request
 * without modification will fail with the same error.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
 */
export default function badRequest(body?: object | string): Response {
	return response(400, body ?? "Bad request");
}
