import response from "./response";
import type { Jsonify } from "../types/Jsonify";
import type TypedResponse from "./TypedResponse";

type BadRequestResponse<T extends object | string | undefined> = T extends object
	? TypedResponse<Jsonify<T>>
	: Response;

/**
 * 400 Bad Request
 *
 * The HTTP 400 Bad Request client error response status code indicates that the
 * server would not process the request due to something the server considered
 * to be a client error. The reason for a 400 response is typically due to
 * malformed request syntax, invalid request message framing, or deceptive
 * request routing.
 *
 * Clients that receive a 400 response should expect that repeating the request
 * without modification will fail with the same error.
 *
 * An object body is typed: it becomes the page's `$props.form` (with its JSON
 * form) after a form submit, so validation errors can be surfaced with their
 * field types via `PageForm`.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
 */
export default function badRequest<T extends object | string | undefined>(
	body?: T,
): BadRequestResponse<T> {
	return response(400, body ?? "Bad request") as BadRequestResponse<T>;
}
