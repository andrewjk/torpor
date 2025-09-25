import response from "./response";

/**
 * 422 Unprocessable Content
 *
 * The HTTP 422 Unprocessable Content client error response status code
 * indicates that the server understood the content type of the request content,
 * and the syntax of the request content was correct, but it was unable to
 * process the contained instructions.
 *
 * Clients that receive a 422 response should expect that repeating the request
 * without modification will fail with the same error.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422
 */
export default function unprocessable(body?: object | string): Response {
	return response(422, body ?? "Unprocessable");
}
