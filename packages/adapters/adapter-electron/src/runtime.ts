import { createNodeServer } from "@torpor/adapter-node";
import { Server } from "@torpor/build/server";
import { existsSync, promises as fs } from "node:fs";
import type { Server as NodeServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import contentType from "./contentType";
import prepareTemplate from "./prepareTemplate";
import type { RunningServer, StartServerOptions } from "./types";

/**
 * Loads a `.env` file from the site root into `process.env`, when the runtime's
 * Node version supports `process.loadEnvFile` (20.12+). Mirrors the CLI, which
 * loads `.env` for dev and preview.
 */
export function loadEnv(root: string): void {
	const file = path.join(root, ".env");
	if (!existsSync(file)) return;
	const loader = (process as { loadEnvFile?: (file: string) => void }).loadEnvFile;
	if (typeof loader !== "function") return;
	try {
		loader.call(process, file);
	} catch {
		// A malformed .env shouldn't take the app down; the CLI reports it in dev
	}
}

/**
 * Builds a Fetch API handler for a built site: it serves everything under
 * `dist/client` statically and routes the rest through `dist/server`'s
 * `serverEntry.load`. Replaces `runPreview`'s Server setup, which isn't
 * exported from @torpor/build.
 */
export async function createRequestHandler(
	root: string,
): Promise<(request: Request) => Promise<Response>> {
	const clientFolder = path.join(root, "dist", "client");
	const serverFolder = path.join(root, "dist", "server");
	const template = await loadTemplate(clientFolder);
	const serverEntry = pathToFileURL(path.join(serverFolder, "serverEntry.js")).href;

	const server = new Server();

	// Serve anything that exists under dist/client (assets, favicon.ico,
	// robots.txt, public files, ...) before falling through to the app
	server.use({
		enter: async (ev) => serveStatic(clientFolder, ev.request),
	});

	server.add("*", async (ev) => {
		try {
			// Node caches the module, so this is only read once
			const { load } = await import(serverEntry);
			return await load(ev, template);
		} catch (error) {
			console.error("[torpor] Unhandled error while rendering:", error);
			return new Response(null, { status: 500 });
		}
	});

	return (request) => server.fetch(request);
}

/**
 * Starts the loopback HTTP server for a built site. Requests are handled in
 * the Electron main process (Node), so cookies, sessions and redirects behave
 * exactly as they do on a normal Node server -- Chromium's session cookie
 * store handles persistence across launches.
 */
export async function startServer(
	root: string,
	options: StartServerOptions = {},
): Promise<RunningServer> {
	loadEnv(root);

	// Adapters may have added the `adapter` property to globalThis; torpor's
	// env() reads it (see @torpor/build/env)
	(globalThis as { adapter?: { env: NodeJS.ProcessEnv } }).adapter = { env: process.env };

	const handler = await createRequestHandler(root);
	const server: NodeServer = createNodeServer(handler);

	const host = options.host ?? "127.0.0.1";
	const port = options.port ?? 0;

	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host, () => resolve());
	});

	const address = server.address();
	const boundPort = typeof address === "object" && address ? address.port : port;

	return {
		url: `http://${host}:${boundPort}`,
		host,
		port: boundPort,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}

async function loadTemplate(clientFolder: string): Promise<string | undefined> {
	// An endpoints-only site has no site.html, and no template is needed
	const siteHtml = path.join(clientFolder, "site.html");
	if (!existsSync(siteHtml)) return undefined;

	const assets = path.join(clientFolder, "assets");
	const clientScript = (await fs.readdir(assets)).find((file) => file.startsWith("clientEntry-"));
	if (!clientScript) {
		throw new Error("clientEntry not found in dist/client/assets");
	}

	return prepareTemplate(await fs.readFile(siteHtml, "utf-8"), `/assets/${clientScript}`);
}

async function serveStatic(clientFolder: string, request: Request): Promise<Response | undefined> {
	if (request.method !== "GET" && request.method !== "HEAD") return undefined;

	let pathname: string;
	try {
		pathname = decodeURIComponent(new URL(request.url).pathname);
	} catch {
		return undefined;
	}

	// Resolve within clientFolder, rejecting any path that escapes it
	const root = path.resolve(clientFolder);
	const file = path.resolve(root, "." + pathname);
	if (file !== root && !file.startsWith(root + path.sep)) return undefined;

	let stats: Awaited<ReturnType<typeof fs.stat>>;
	try {
		stats = await fs.stat(file);
	} catch {
		return undefined;
	}
	if (!stats.isFile()) return undefined;

	const headers = { "Content-Type": contentType(path.extname(file)) };
	if (request.method === "HEAD") {
		return new Response(null, { status: 200, headers });
	}
	return new Response(await fs.readFile(file), { status: 200, headers });
}
