import type { Jsonify } from "../types/Jsonify";
import type TypedResponse from "./TypedResponse";
import response from "./response";

type CreatedResponse<T extends object | string | undefined> = T extends object
	? TypedResponse<Jsonify<T>>
	: Response;

/**
 * 201 Created
 *
 * The HTTP 201 Created successful response status code indicates that the HTTP
 * request has led to the creation of a resource. This status code is commonly
 * sent as the result of a POST request.
 *
 * The new resource, or a description and link to the new resource, is created
 * before the response is returned. The newly-created items can be returned in
 * the body of the response message, but must be locatable by the URL of the
 * initiating request or by the URL in the value of the Location header provided
 * with the response.
 *
 * An object body is typed: the client sees its JSON form through
 * `makeApi`-created callers.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
 */
export default function created<T extends object | string | undefined>(
	body?: T,
): CreatedResponse<T> {
	return response(201, body) as CreatedResponse<T>;
}
