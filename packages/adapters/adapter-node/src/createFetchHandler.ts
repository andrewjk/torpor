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
		super(body, init);
		this[INTERNAL_BODY] = body;
	}
};

export function createFetchHandler(handler: (req: Request) => Response | Promise<Response>) {
	return async (
		incoming: IncomingMessage | Http2ServerRequest,
		outgoing: ServerResponse | Http2ServerResponse,
	): Promise<void> => {
		const req = await nodeMessageToRequest(incoming);
		const res = await handler(req);
		return await responseToNodeResponse(res, outgoing);
	};
}
