import { type IncomingMessage } from "node:http";
import { Http2ServerRequest } from "node:http2";
import { Readable } from "node:stream";
import flattenHeaders from "./flattenHeaders";

// From https://stackoverflow.com/a/78849544
// and https://gist.github.com/marvinhagemeister/cc236ec97235ce0305ae9d48a24a607d

export default async function nodeMessageToRequest(
	req: IncomingMessage | Http2ServerRequest,
): Promise<Request> {
	// Build the full url
	let path = req.url;
	if (path === undefined) {
		throw new Error(`Empty request URL`);
	}
	if (!path.startsWith("/")) {
		path = "/" + path;
	}
	const { host } = req.headers;
	if (host == undefined) {
		throw new Error(`Missing "Host" header`);
	}
	const protocol = "encrypted" in req.socket && req.socket.encrypted ? "https" : "http";
	const url = `${protocol}://${host}${path}`;

	// Flatten the headers
	const headers = flattenHeaders(req.headers);

	// Convert body to Buffer if applicable
	const body =
		req.method !== "GET" && req.method !== "HEAD"
			? (Readable.toWeb(req) as ReadableStream) // await readableToBuffer(req)
			: null;

	return new Request(url, {
		method: req.method,
		headers: headers,
		// eslint-disable-next-line no-invalid-fetch-options
		body: body,
		// @ts-ignore this is needed for using a Readable for some reason
		duplex: "half",
	});
}
