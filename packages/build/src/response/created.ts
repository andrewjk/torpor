import response from "./response";

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
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
 */
export default function created(body?: object | string): Response {
	return response(201, body);
}
