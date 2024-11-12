import response from "./response";

/**
 * 200 OK
 *
 * The request succeeded. The result meaning of "success" depends on the HTTP
 * method:
 * - GET: The resource has been fetched and transmitted in the message body.
 * - HEAD: The representation headers are included in the response without any
 *   message body.
 * - PUT or POST: The resource describing the result of the action is
 *   transmitted in the message body.
 * - TRACE: The message body contains the request message as received by the
 *   server.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
 */
export default function ok(body?: object | string): Response {
	return response(200, body);
}
