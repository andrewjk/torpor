import { type IncomingMessage } from "node:http";
import { Readable } from "node:stream";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/connectToWeb.ts

const DUMMY_BASE_URL = "http://localhost";

/**
 * Creates an IncomingMessage object from a web Request.
 *
 * The request body is intentionally not forwarded: this is only used to wrap
 * Connect-style middlewares (e.g. Vite's dev middleware), which don't read
 * the body. The actual route handler later reads `ev.request.body` directly,
 * and forwarding the body here would consume it and break the handler.
 *
 * @param {Request} request - The web Request object.
 * @returns {IncomingMessage} An IncomingMessage-like object compatible with Node.js HTTP module.
 */
export default function requestToNodeMessage(request: Request): IncomingMessage {
	const parsedUrl = new URL(request.url, DUMMY_BASE_URL);
	const pathAndQuery = (parsedUrl.pathname || "") + (parsedUrl.search || "");
	const body = Readable.from([]);

	return Object.assign(body, {
		url: pathAndQuery,
		method: request.method,
		headers: Object.fromEntries(request.headers),
	}) as IncomingMessage;
}
