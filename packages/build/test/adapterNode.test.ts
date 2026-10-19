import { createHash } from "node:crypto";
import type { Server } from "node:http";
import net from "node:net";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { createNodeServer, upgradePair } from "../../adapters/adapter-node/src/index.ts";

const servers: Server[] = [];

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise<void>((resolve) => {
					server.close(() => resolve());
					server.closeAllConnections();
				}),
		),
	);
});

async function listen(server: Server): Promise<{ url: string; port: number }> {
	servers.push(server);
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
	const { port } = server.address() as AddressInfo;
	return { url: `http://127.0.0.1:${port}`, port };
}

describe("createNodeServer", () => {
	test("streams a ReadableStream response body", async () => {
		const encoder = new TextEncoder();
		let controller!: ReadableStreamDefaultController<Uint8Array>;
		const body = new ReadableStream<Uint8Array>({
			start(c) {
				controller = c;
				c.enqueue(encoder.encode("one"));
			},
		});
		const { url } = await listen(
			createNodeServer(
				async () =>
					new Response(body, {
						headers: { "Content-Type": "text/event-stream" },
					}),
			),
		);

		const response = await fetch(`${url}/events`);
		expect(response.headers.get("Content-Type")).toContain("text/event-stream");
		const reader = response.body!.getReader();
		const decoder = new TextDecoder();

		// The first chunk arrives before the stream is closed
		const first = await reader.read();
		expect(decoder.decode(first.value)).toBe("one");

		controller.enqueue(encoder.encode("two"));
		controller.close();
		let rest = "";
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			rest += decoder.decode(chunk.value);
		}
		expect(rest).toBe("two");
	});

	test("routes upgrade requests to the handler with the raw socket pair", async () => {
		const key = "dGhlIHNhbXBsZSBub25jZQ==";
		const expected = createHash("sha1")
			.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
			.digest("base64");

		const { port } = await listen(
			createNodeServer(async (request) => {
				const pair = upgradePair(request);
				if (!pair) return new Response("expected an upgrade", { status: 400 });
				expect(pair.head.length).toBe(0);
				pair.socket.write(
					"HTTP/1.1 101 Switching Protocols\r\n" +
						"Upgrade: websocket\r\n" +
						"Connection: Upgrade\r\n" +
						`Sec-WebSocket-Accept: ${expected}\r\n\r\n`,
				);
				pair.socket.end();
				return new Response(null, { status: 101 });
			}),
		);

		const response = await rawUpgrade(port, key);
		expect(response).toContain("101 Switching Protocols");
		expect(response).toContain(`Sec-WebSocket-Accept: ${expected}`);
	});

	test("answers a rejected upgrade on the raw socket", async () => {
		const { port } = await listen(
			createNodeServer(async () => new Response("no websockets here", { status: 403 })),
		);

		const response = await rawUpgrade(port, "dGhlIHNhbXBsZSBub25jZQ==");
		expect(response).toContain("403 Forbidden");
		expect(response).toContain("no websockets here");
	});
});

/** Sends a WebSocket upgrade request and resolves with the raw response. */
function rawUpgrade(port: number, key: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const socket = net.connect(port, "127.0.0.1");
		let data = "";
		socket.setEncoding("utf8");
		socket.on("data", (chunk) => (data += chunk));
		socket.on("end", () => resolve(data));
		socket.on("error", reject);
		socket.on("connect", () => {
			socket.write(
				"GET /ws HTTP/1.1\r\n" +
					"Host: localhost\r\n" +
					"Upgrade: websocket\r\n" +
					"Connection: Upgrade\r\n" +
					`Sec-WebSocket-Key: ${key}\r\n` +
					"Sec-WebSocket-Version: 13\r\n\r\n",
			);
		});
	});
}
