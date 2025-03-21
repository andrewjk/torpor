import { type IncomingMessage } from "node:http";
import { Readable } from "node:stream";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/connectToWeb.ts

const DUMMY_BASE_URL = "http://localhost";

/**
 * Creates an IncomingMessage object from a web Request.
 *
 * @param {Request} request - The web Request object.
 * @returns {IncomingMessage} An IncomingMessage-like object compatible with Node.js HTTP module.
 */
export default function requestToNodeMessage(request: Request): IncomingMessage {
	const parsedUrl = new URL(request.url, DUMMY_BASE_URL);
	const pathAndQuery = (parsedUrl.pathname || "") + (parsedUrl.search || "");
	const body = request.body ? Readable.fromWeb(request.body as any) : Readable.from([]);

	return Object.assign(body, {
		url: pathAndQuery,
		method: request.method,
		headers: Object.fromEntries(request.headers),
	}) as IncomingMessage;
}
