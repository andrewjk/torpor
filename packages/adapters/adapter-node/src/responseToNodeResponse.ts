import { ServerResponse } from "node:http";
import { Http2ServerResponse } from "node:http2";
import { isArrayBufferView } from "node:util/types";
import { INTERNAL_BODY } from "./constants";

export default async function responseToNodeResponse(
	res: Response,
	outgoing: ServerResponse | Http2ServerResponse,
): Promise<void> {
	outgoing.statusCode = res.status;
	outgoing.statusMessage = res.statusText;

	res.headers.forEach((value, key) => {
		outgoing.setHeader(key, value);
	});

	const body = (res as any)[INTERNAL_BODY];

	if (body === null || body === undefined) {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	} else if (typeof body === "string" || body instanceof Uint8Array) {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(body);
	} else if (body instanceof Blob) {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(await body.arrayBuffer()));
	} else if (body instanceof ArrayBuffer) {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(body));
	} else if (isArrayBufferView(body)) {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end(new Uint8Array(body.buffer));
	} else if (body instanceof FormData) {
		// TODO
		outgoing.setHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	} else {
		// @ts-ignore
		outgoing.writeHead(res.status, res.statusText);
		outgoing.end();
	}
}
