import response from "./response";

/**
 * Although the HTTP standard specifies "unauthorized", semantically this
 * response means "unauthenticated". That is, the client must authenticate
 * itself to get the requested response.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
 */
export default function unauthorized(body?: object | string): Response {
	return response(401, body);
}
