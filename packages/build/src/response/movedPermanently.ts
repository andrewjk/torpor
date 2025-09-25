import transfer from "./transfer";

/**
 * 301 Moved Permanently
 *
 * The HTTP 301 Moved Permanently redirection response status code indicates
 * that the requested resource has been permanently moved to the URL in the
 * Location header.
 *
 * A browser receiving this status will automatically request the resource at
 * the URL in the Location header, redirecting the user to the new page. Search
 * engines receiving this response will attribute links to the original URL to
 * the redirected resource, passing the SEO ranking to the new URL.
 *
 * > Note: In the Fetch Standard, when a user agent receives a 301 in response
 * > to a POST request, it uses the GET method in the subsequent redirection
 * > request, as permitted by the HTTP specification. To avoid user agents
 * > modifying the request, use 308 Permanent Redirect instead, as altering the
 * > method after a 308 response is prohibited.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301
 */
export default function permRedirect(location: string): Response {
	return transfer(308, location);
}
