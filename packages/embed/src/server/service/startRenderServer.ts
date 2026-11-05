import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import renderEmbed, { type RenderEmbedOptions } from "../renderEmbed";
import type EmbedArtifact from "../../types/EmbedArtifact";
import type EmbedRenderResult from "../../types/EmbedRenderResult";
import EmbedVersionError from "../../types/EmbedVersionError";
import getRuntimeVersion from "../getRuntimeVersion";

export interface RenderServerOptions {
	/**
	 * Port to listen on. Default 0: an ephemeral port, so tests and dev
	 * loops don't collide. In production, pin it or front it with your
	 * orchestrator's service discovery.
	 */
	port?: number;

	/**
	 * Host to bind. Default "127.0.0.1": loopback only. In production, run
	 * the render service in a container whose only ingress is from your
	 * app's network.
	 */
	host?: string;

	/**
	 * When set, requests must carry `authorization: Bearer <token>`.
	 * Strongly recommended unless the network between your app and the
	 * render pool is otherwise locked down.
	 */
	token?: string;

	/**
	 * Maximum request body size in bytes. Default 1MB (an artifact plus
	 * props is typically a few KB).
	 */
	maxBodyBytes?: number;

	/**
	 * Default render timeout in milliseconds for requests that don't carry
	 * their own. Default 5000.
	 */
	timeout?: number;
}

export interface RenderServer {
	/**
	 * The base URL the server is listening on, e.g.
	 * `http://127.0.0.1:53111`.
	 */
	url: string;

	port: number;

	/**
	 * Stops the server and closes open connections.
	 */
	close(): Promise<void>;
}

interface RenderRequest {
	artifact: EmbedArtifact;
	props?: Record<string, any>;
	context?: Record<string, any>;
	timeout?: number;
	/** Present only so the boundary check below can reject it. */
	slots?: unknown;
}

/**
 * Runs a tiny HTTP render service: POST /render renders an artifact with
 * `renderEmbed` and returns `{ body, head }`. Pair it with
 * `createServiceRenderer` on the app side.
 *
 * This is the bridge that makes strong isolation possible: run this server
 * in a locked-down container (non-root, read-only filesystem, no network
 * egress, memory/CPU caps) and rendering untrusted embeds happens inside
 * that boundary, not inside your app. The container is the security
 * boundary; this server is just the protocol.
 *
 * Slots and the host bridge are functions and cannot cross the service
 * boundary -- pass data as props instead; requests carrying slots are
 * rejected.
 */
export default function startRenderServer(options?: RenderServerOptions): Promise<RenderServer> {
	const maxBodyBytes = options?.maxBodyBytes ?? 1_000_000;
	const defaultTimeout = options?.timeout ?? 5000;

	const app = createServer((request, response) => {
		void handle(request, response).catch((error: unknown) => {
			json(response, 500, { error: error instanceof Error ? error.message : String(error) });
		});
	});

	return new Promise((resolve, reject) => {
		app.on("error", reject);
		app.listen(options?.port ?? 0, options?.host ?? "127.0.0.1", () => {
			const address = app.address();
			if (address === null || typeof address === "string") {
				reject(new Error("Render server failed to bind a port"));
				return;
			}
			resolve({
				url: `http://${options?.host ?? "127.0.0.1"}:${address.port}`,
				port: address.port,
				close: async () => {
					await new Promise<void>((resolveClose) => app.close(() => resolveClose()));
					app.closeAllConnections();
				},
			});
		});
	});

	async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
		if (request.method === "GET" && request.url === "/version") {
			json(response, 200, { version: getRuntimeVersion() });
			return;
		}
		if (request.method !== "POST" || request.url !== "/render") {
			json(response, 404, { error: "Not found" });
			return;
		}
		if (options?.token !== undefined && !authorized(request, options.token)) {
			json(response, 401, { error: "Unauthorized" });
			return;
		}

		const body = await readBody(request, maxBodyBytes);
		if (body === null) {
			json(response, 413, { error: "Request body too large" });
			// The client is still sending; respond first (done above), then
			// cut the socket once the response has flushed
			response.on("finish", () => request.destroy());
			return;
		}
		let payload: RenderRequest;
		try {
			payload = JSON.parse(body) as RenderRequest;
		} catch {
			json(response, 400, { error: "Invalid JSON" });
			return;
		}
		if (payload.slots !== undefined) {
			json(response, 400, {
				error: "Slots cannot cross the render service boundary -- pass data as props",
			});
			return;
		}

		const renderOptions: RenderEmbedOptions = {
			props: payload.props ?? {},
			context: payload.context,
			timeout: payload.timeout ?? defaultTimeout,
		};
		try {
			const result: EmbedRenderResult = await renderEmbed(payload.artifact, renderOptions);
			json(response, 200, result);
		} catch (error) {
			if (error instanceof EmbedVersionError) {
				json(response, 409, { error: error.message });
			} else {
				json(response, 500, { error: error instanceof Error ? error.message : String(error) });
			}
		}
	}
}

function json(response: ServerResponse, status: number, payload: unknown): void {
	const body = JSON.stringify(payload);
	response.writeHead(status, {
		"content-type": "application/json",
		"content-length": Buffer.byteLength(body),
	});
	response.end(body);
}

function readBody(request: IncomingMessage, maxBytes: number): Promise<string | null> {
	return new Promise((resolve) => {
		let size = 0;
		const chunks: Buffer[] = [];
		let done = false;
		request.on("data", (chunk: Buffer) => {
			if (done) return;
			size += chunk.length;
			if (size > maxBytes) {
				done = true;
				// Stop consuming; the handler responds 413 and then drops the
				// socket
				request.pause();
				resolve(null);
				return;
			}
			chunks.push(chunk);
		});
		request.on("end", () => {
			if (!done) resolve(chunks.join(""));
		});
		request.on("error", () => {
			if (!done) resolve(null);
		});
	});
}

/**
 * Bearer token check. Compares SHA-256 digests so token length doesn't
 * leak through timing.
 */
function authorized(request: IncomingMessage, token: string): boolean {
	const header = request.headers.authorization ?? "";
	const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
	const providedHash = createHash("sha256").update(provided).digest();
	const tokenHash = createHash("sha256").update(token).digest();
	return timingSafeEqual(providedHash, tokenHash);
}
