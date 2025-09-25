import transfer from "./transfer";

/**
 * 304 Not Modified
 *
 * The HTTP 304 Not Modified redirection response status code indicates that
 * there is no need to retransmit the requested resources.
 *
 * This response code is sent when the request is a conditional GET or HEAD
 * request with an If-None-Match or an If-Modified-Since header and the
 * condition evaluates to 'false'. It confirms that the resource cached by the
 * client is still valid and that the server would have sent a 200 OK response
 * with the resource if the condition evaluated to 'true'. See HTTP caching for
 * more information.
 *
 * The response must not contain a body and must include the headers that would
 * have been sent in an equivalent 200 response, such as:
 *
 * - Cache-Control
 * - Content-Location
 * - Date
 * - ETag
 * - Expires
 * - Vary
 *
 * > Note: Many developer tools' network panels of browsers create extraneous
 * > requests leading to 304 responses, so that access to the local cache is
 * > visible to developers.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304
 */
export default function notModified(location: string): Response {
	return transfer(304, location);
}
