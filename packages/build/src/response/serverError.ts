import response from "./response";

/**
 * 500 Server Error
 *
 * The server has encountered a situation it does not know how to handle.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
 */
export default function serverError(body?: object | string): Response {
	return response(500, body);
}
