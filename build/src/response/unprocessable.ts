import response from "./response";

/**
 * 422 Unprocessable Content
 *
 * The request was well-formed but was unable to be followed due to semantic errors.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
 */
export default function unprocessable(body?: object | string): Response {
	return response(422, body);
}
