import { type IncomingMessage, ServerResponse } from "node:http";
import { Http2ServerRequest, Http2ServerResponse } from "node:http2";
import { INTERNAL_BODY } from "./constants";
import nodeMessageToRequest from "./nodeMessageToRequest";
import responseToNodeResponse from "./responseToNodeResponse";

// From https://gist.github.com/marvinhagemeister/cc236ec97235ce0305ae9d48a24a607d
// Referenced from https://marvinh.dev/blog/modern-way-to-write-javascript-servers/

const GlobalResponse = Response;
globalThis.Response = class Response extends GlobalResponse {
	[INTERNAL_BODY]: BodyInit | null | undefined = null;

	constructor(body?: BodyInit | null, init?: ResponseInit) {
		// Node's Response rejects 101 (it only allows 200-599), but an upgrade
		// handler needs to return one to hand the socket back to the adapter.
		// Build a normal Response and override the status afterwards.
		const status = init?.status;
		super(body, status === 101 ? { ...init, status: 200 } : init);
		if (status === 101) {
			Object.defineProperty(this, "status", { value: 101 });
		}
		this[INTERNAL_BODY] = body;
	}
};

export function createFetchHandler(handler: (req: Request) => Response | Promise<Response>) {
	return async (
		incoming: IncomingMessage | Http2ServerRequest,
		outgoing: ServerResponse | Http2ServerResponse,
	): Promise<void> => {
		try {
			const req = await nodeMessageToRequest(incoming);
			const res = await handler(req);
			await responseToNodeResponse(res, outgoing);
		} catch (error) {
			if (outgoing.destroyed) return;
			console.error("[torpor] Unhandled error while responding:", error);
			// A stream that failed after the headers went out (e.g. a client
			// disconnecting mid-SSE) can't be turned into a 500 any more
			if (outgoing.headersSent) {
				outgoing.destroy();
			} else {
				outgoing.statusCode = 500;
				outgoing.end("Internal Server Error");
			}
		}
	};
}
