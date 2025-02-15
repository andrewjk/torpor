import transfer from "./transfer";

/**
 * 307 Temporary Redirect
 *
 * The server sends this response to direct the client to get the requested
 * resource at another URI with the same method that was used in the prior
 * request. This has the same semantics as the 302 Found HTTP response code,
 * with the exception that the user agent must not change the HTTP method used:
 * if a POST was used in the first request, a POST must be used in the second
 * request.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
 */
export default function redirect(location: string): Response {
	return transfer(307, location);
}
