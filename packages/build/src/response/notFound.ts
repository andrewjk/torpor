import response from "./response";

/**
 * 404 Not Found
 *
 * The HTTP 404 Not Found client error response status code indicates that the
 * server cannot find the requested resource. Links that lead to a 404 page are
 * often called broken or dead links and can be subject to link rot.
 *
 * A 404 status code only indicates that the resource is missing without
 * indicating if this is temporary or permanent. If a resource is permanently
 * removed, servers should send the 410 Gone status instead.
 *
 * 404 errors on a website can lead to a poor user experience for your visitors,
 * so the number of broken links (internal and external) should be minimized to
 * prevent frustration for readers. Common causes of 404 responses are mistyped
 * URLs or pages that are moved or deleted without redirection. For more
 * information, see the Redirections in HTTP guide.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404
 */
export default function notFound(body?: object | string): Response {
	return response(404, body ?? "Not found");
}
