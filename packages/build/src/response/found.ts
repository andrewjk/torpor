import transfer from "./transfer";

/**
 * 302 Found
 *
 * The HTTP 302 Found redirection response status code indicates that the
 * requested resource has been temporarily moved to the URL in the Location
 * header.
 *
 * A browser receiving this status will automatically request the resource at
 * the URL in the Location header, redirecting the user to the new page. Search
 * engines receiving this response will not attribute links to the original URL
 * to the new resource, meaning no SEO value is transferred to the new URL.
 *
 * > Note: In the Fetch Standard, when a user agent receives a 302 in response
 * > to a POST request, it uses the GET method in the subsequent redirection
 * > request, as permitted by the HTTP specification. To avoid user agents
 * > modifying the request, use 307 Temporary Redirect instead, as altering the
 * > method after a 307 response is prohibited.
 *
 * > In cases where you want any request method to be changed to GET, use 303
 * > See Other. This is useful when you want to give a response to a PUT method
 * > that is not the uploaded resource but a confirmation message such as: "you
 * > successfully uploaded XYZ".
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/302
 */
export default function permRedirect(location: string): Response {
	return transfer(308, location);
}
