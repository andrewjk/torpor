import response from "./response";

/**
 * 404 Not Found
 *
 * The server cannot find the requested resource. In the browser, this means the
 * URL is not recognized. In an API, this can also mean that the endpoint is
 * valid but the resource itself does not exist. Servers may also send this
 * response instead of 403 Forbidden to hide the existence of a resource from an
 * unauthorized client. This response code is probably the most well known due
 * to its frequent occurrence on the web.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
 */
export default function notFound(body?: object | string): Response {
	return response(404, body ?? "Not found");
}
