import response from "./response";

/**
 * 500 Server Error
 *
 * The HTTP 500 Internal Server Error server error response status code
 * indicates that the server encountered an unexpected condition that prevented
 * it from fulfilling the request. This error is a generic "catch-all" response
 * to server issues, indicating that the server cannot find a more appropriate
 * 5XX error to respond with.
 *
 * If you're a visitor seeing 500 errors on a web page, these issues require
 * investigation by server owners or administrators. There are many possible
 * causes of 500 errors, including: improper server configuration, out-of-memory
 * (OOM) issues, unhandled exceptions, improper file permissions, or other
 * complex factors. Server administrators may proactively log occurrences of
 * server error responses, like the 500 status code, with details about the
 * initiating requests to improve the stability of a service in the future.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/500
 */
export default function serverError(body?: object | string): Response {
	return response(500, body ?? "Server error");
}
