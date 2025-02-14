/**
 * Creates a response with the supplied status code and optional body.
 *
 * If the body is an object, it will be converted to JSON and the content-type
 * header set to "application/json". Otherwise, if the body is a string, the
 * content-type header will be set to "text/plain".
 */
export default function response(status: number, body?: object | string) {
	let headers: Record<string, string> | undefined = undefined;
	if (body) {
		if (typeof body === "object") {
			headers = { "content-type": "application/json" };
			body = JSON.stringify(body);
		} else {
			headers = { "content-type": "text/plain" };
		}
	}
	return new Response(body, {
		status,
		headers,
	});
}
