import response from "./response";
import type { Jsonify } from "../types/Jsonify";
import type TypedResponse from "./TypedResponse";

type UnprocessableResponse<T extends object | string | undefined> = T extends object
	? TypedResponse<Jsonify<T>>
	: Response;

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
 * An object body is typed: it becomes the page's `$props.form` (with its JSON
 * form) after a form submit, so validation errors can be surfaced with their
 * field types via `PageForm`.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422
 */
export default function unprocessable<T extends object | string | undefined>(
	body?: T,
): UnprocessableResponse<T> {
	return response(422, body ?? "Unprocessable") as UnprocessableResponse<T>;
}
