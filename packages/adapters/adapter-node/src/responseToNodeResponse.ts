import { ServerResponse } from "node:http";
import { Http2ServerResponse } from "node:http2";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { isArrayBufferView } from "node:util/types";
import { INTERNAL_BODY } from "./constants";

export default async function responseToNodeResponse(
	res: Response,
	outgoing: ServerResponse | Http2ServerResponse,
): Promise<void> {
	res.headers.forEach((value, key) => {
		outgoing.setHeader(key, value);
	});

	const body = (res as any)[INTERNAL_BODY];

	// `writeHead(status)` uses node's standard reason phrase for the code
	// (the same one undici's `statusText` carries)
	if (body === null || body === undefined) {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end();
	} else if (typeof body === "string" || body instanceof Uint8Array) {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end(body);
	} else if (body instanceof Blob) {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end(new Uint8Array(await body.arrayBuffer()));
	} else if (body instanceof ArrayBuffer) {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end(new Uint8Array(body));
	} else if (isArrayBufferView(body)) {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end(new Uint8Array(body.buffer));
	} else if (body instanceof FormData) {
		outgoing.setHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end();
	} else if (body instanceof ReadableStream) {
		// Stream the body through as it arrives (SSE, long-lived responses).
		// Flush the headers before the first chunk so the client sees the
		// response immediately, and await the pipeline so errors tear the
		// stream down cleanly
		// @ts-ignore
		outgoing.writeHead(res.status);
		if ("flushHeaders" in outgoing) {
			outgoing.flushHeaders();
		}
		await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream), outgoing);
	} else {
		// @ts-ignore
		outgoing.writeHead(res.status);
		outgoing.end();
	}
}
