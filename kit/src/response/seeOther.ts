import transfer from "./transfer";

/**
 * 303 See Other
 *
 * The server sent this response to direct the client to get the requested
 * resource at another URI with a GET request.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303
 */
export default function seeOther(location: string): Response {
	return transfer(303, location);
}
