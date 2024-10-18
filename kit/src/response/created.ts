import response from "./response";

/**
 * 201 Created
 *
 * The request succeeded, and a new resource was created as a result. This is
 * typically the response sent after POST requests, or some PUT requests.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201
 */
export default function created(body?: object | string): Response {
	return response(201, body);
}
