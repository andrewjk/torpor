import { STATUS_CODES, type IncomingMessage } from "node:http";
import { type Duplex } from "node:stream";
import { INTERNAL_UPGRADE, type UpgradePair } from "./constants";
import nodeMessageToRequest from "./nodeMessageToRequest";

/**
 * The raw Node handles for an HTTP upgrade request. A fetch handler that wants
 * to accept an upgrade (e.g. a WebSocket handshake) reads them from the
 * request with `upgradePair(request)`, completes the handshake itself, and
 * returns a 101 Response. Any other status is sent to the client and the
 * socket is closed.
 */
export function upgradePair(request: Request): UpgradePair | undefined {
	return (request as Request & { [INTERNAL_UPGRADE]?: UpgradePair })[INTERNAL_UPGRADE];
}

export default function createUpgradeHandler(
	handler: (req: Request) => Response | Promise<Response>,
): (incoming: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void> {
	return async (incoming, socket, head) => {
		try {
			const request = await nodeMessageToRequest(incoming);
			(request as Request & { [INTERNAL_UPGRADE]?: UpgradePair })[INTERNAL_UPGRADE] = {
				socket,
				head,
			};

			const response = await handler(request);
			if (response.status === 101) {
				// The handler wrote the handshake and owns the socket from here
				// on (e.g. through `ws`'s handleUpgrade)
				return;
			}
			await rejectUpgrade(response, socket);
		} catch (error) {
			console.error("[torpor] Unhandled error during an upgrade request:", error);
			if (!socket.destroyed && !socket.writableEnded) {
				socket.end("HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n");
			}
		}
	};
}

/** Answers a non-101 upgrade response on the raw socket, then closes it. */
async function rejectUpgrade(response: Response, socket: Duplex): Promise<void> {
	if (socket.destroyed) return;

	const headers: string[] = [];
	response.headers.forEach((value, key) => headers.push(`${key}: ${value}`));
	const status = STATUS_CODES[response.status] ?? "";
	const body = Buffer.from(await response.arrayBuffer());

	socket.write(`HTTP/1.1 ${response.status} ${status}\r\n`);
	if (headers.length > 0) socket.write(headers.join("\r\n") + "\r\n");
	socket.end(body);
}
