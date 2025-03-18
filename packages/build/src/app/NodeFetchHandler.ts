import { type IncomingMessage, ServerResponse } from "node:http";
import { Http2ServerRequest, Http2ServerResponse } from "node:http2";
import { isArrayBufferView } from "node:util/types";

// From https://gist.github.com/marvinhagemeister/cc236ec97235ce0305ae9d48a24a607d
// Referenced from https://marvinh.dev/blog/modern-way-to-write-javascript-servers/

const INTERNAL_BODY = Symbol("internal_body");

const GlobalResponse = Response;
globalThis.Response = class Response extends GlobalResponse {
	[INTERNAL_BODY]: BodyInit | null | undefined = null;

	constructor(body?: BodyInit | null, init?: ResponseInit) {
		super(body, init);
		this[INTERNAL_BODY] = body;
	}
};

function incomingToRequest(req: IncomingMessage | Http2ServerRequest): Request {
	if (req.url === undefined) throw new Error(`Empty request URL`);

	const { host } = req.headers;
	if (host == undefined) throw new Error(`Missing "Host" header`);

	const protocol = "encrypted" in req.socket && req.socket.encrypted ? "https" : "http";

	return new Request(`${protocol}://${host}/${req.url}`, {
		method: req.method,
		// Node types this as a strongly typed interface
		headers: req.headers as Record<string, string>,
	});
}

async function applyResponse(res: Response, outgoing: ServerResponse | Http2ServerResponse) {
	outgoing.statusCode = res.status;
	outgoing.statusMessage = res.statusText;

	res.headers.forEach((value, key) => {
		outgoing.setHeader(key, value);
	});

	// deno-lint-ignore no-explicit-any
	const body = (res as any)[INTERNAL_BODY];

	if (body === null || body === undefined) {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	} else if (typeof body === "string" || body instanceof Uint8Array) {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(body);
	} else if (body instanceof Blob) {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(await body.arrayBuffer()));
	} else if (body instanceof ArrayBuffer) {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(body));
	} else if (isArrayBufferView(body)) {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(body.buffer));
	} else if (body instanceof FormData) {
		// TODO
		outgoing.setHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	} else {
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	}
}

export function createFetchHandler(handler: (req: Request) => Response | Promise<Response>) {
	return async (
		incoming: IncomingMessage | Http2ServerRequest,
		outgoing: ServerResponse | Http2ServerResponse,
	) => {
		const req = incomingToRequest(incoming);
		const res = await handler(req);
		return await applyResponse(res, outgoing);
	};
}
