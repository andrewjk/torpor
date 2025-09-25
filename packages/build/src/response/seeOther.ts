import transfer from "./transfer";

/**
 * 303 See Other
 *
 * The HTTP 303 See Other redirection response status code indicates that the
 * browser should redirect to the URL in the Location header instead of
 * rendering the requested resource.
 *
 * This response code is often sent back as a result of PUT or POST methods so
 * the client may retrieve a confirmation, or view a representation of a
 * real-world object (see HTTP range-14). The method to retrieve the redirected
 * resource is always GET.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/303
 */
export default function seeOther(location: string): Response {
	return transfer(303, location);
}
