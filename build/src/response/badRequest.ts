import response from "./response";

/**
 * 400 Bad Request
 *
 * The server cannot or will not process the request due to something that is
 * perceived to be a client error (e.g., malformed request syntax, invalid
 * request message framing, or deceptive request routing).
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
 */
export default function badRequest(body?: object | string): Response {
	return response(400, body);
}
