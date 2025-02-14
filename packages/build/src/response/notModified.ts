import transfer from "./transfer";

/**
 * 304 Not Modified
 *
 * This is used for caching purposes. It tells the client that the response has
 * not been modified, so the client can continue to use the same cached version
 * of the response.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304
 */
export default function notModified(location: string): Response {
	return transfer(304, location);
}
