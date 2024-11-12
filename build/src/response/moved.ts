import transfer from "./transfer";

/**
 * 308 Permanent Redirect
 *
 * This means that the resource is now permanently located at another URI,
 * specified by the Location: HTTP Response header. This has the same semantics
 * as the 301 Moved Permanently HTTP response code, with the exception that the
 * user agent must not change the HTTP method used: if a POST was used in the
 * first request, a POST must be used in the second request.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
 */
export default function moved(location: string): Response {
	return transfer(308, location);
}
