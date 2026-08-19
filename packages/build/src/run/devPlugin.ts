import { type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { type Plugin, type ViteDevServer } from "vite";
import { serverError } from "../response.ts";
import Server from "../server/Server.ts";
import flattenHeaders from "../server/connect/flattenHeaders.ts";
import type Site from "../site/Site.ts";
import prepareTemplate from "./prepareTemplate.ts";

type ReqHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/**
 * The default Node-runtime dev plugin. Reads `src/site.html`, sets up a torpor
 * `Server` whose catch-all route renders via `vite.ssrLoadModule`, and registers
 * a Connect middleware (after Vite's own middlewares) that bridges Node
 * req/res to the torpor Server's fetch handler.
 *
 * Adapters that need a different runtime (e.g. workerd) provide their own
 * `dev()` plugin instead.
 */
export default function devPlugin(site: Site): Plugin {
	return {
		name: "torpor-dev",
		configureServer(vite) {
			// Kick off async setup immediately; the middleware awaits it so we
			// don't depend on whether Vite awaits configureServer itself.
			const handlerPromise = createDevHandler(vite, site);
			// Return a post-hook so our middleware runs AFTER Vite's internal
			// middlewares (static serving, transforms, HMR), acting as the SSR
			// fallback.
			return () => {
				vite.middlewares.use(async (req, res, next) => {
					try {
						const handler = await handlerPromise;
						await handler(req, res);
					} catch (e) {
						next(e as Error);
					}
				});
			};
		},
	};
}

async function createDevHandler(vite: ViteDevServer, site: Site): Promise<ReqHandler> {
	const siteFolder = path.resolve(site.root, "./node_modules/@torpor/build/src/site/");
	const serverScript = path.join(siteFolder, "serverEntry.ts");

	// Read site.html if present
	// It's called site.html because @torpor/build builds the site (html, routes
	// etc) while the user builds the app (components etc). An endpoints-only
	// site has no site.html, and no template is needed
	let template: string | undefined;
	const templateFile = path.resolve(site.root, "src/site.html");
	if (existsSync(templateFile)) {
		template = await fs.readFile(templateFile, "utf-8");

		// Apply Vite HTML transforms. This injects the Vite HMR client, and also
		// applies HTML transforms from Vite plugins. Note that we only support a
		// universal transform, not individual transforms for each route
		template = await vite.transformIndexHtml("", template);

		// Prepare site.html so that we can just splice components into it
		const clientScript = path.join(siteFolder, "clientEntry.ts");
		const clientDevScript = path.join(siteFolder, "clientEntryDev.ts");
		template = prepareTemplate(template, clientScript, clientDevScript);
	}

	const server = new Server();

	// Every request (GET, POST, etc) goes through loadEndPoint
	server.add("*", async (ev) => {
		try {
			// Load the server entry. ssrLoadModule automatically transforms ESM
			// source code to be usable in Node.js. No bundling is required, and
			// it provides efficient invalidation similar to HMR
			const { load } = await vite.ssrLoadModule(serverScript);

			// Render the app HTML (or fetch server data etc) via serverEntry's
			// exported `load` function
			return await load(ev, template);
		} catch (e: any) {
			// If an error is caught, let Vite fix the stack trace so it maps
			// back to your actual source code
			vite.ssrFixStacktrace(e);
			return serverError(e);
		}
	});

	// Put adapter-specific functionality in the `adapter` property of
	// globalThis for now
	// @ts-ignore
	globalThis.adapter = { env: process.env };

	return async (req, res) => {
		const request = await nodeReqToRequest(req);
		const response = await server.fetch(request);
		await sendResponse(response, res);
	};
}

async function nodeReqToRequest(req: IncomingMessage): Promise<Request> {
	const url = req.url ?? "/";
	const host = req.headers.host ?? "localhost";
	const protocol = "encrypted" in req.socket && req.socket.encrypted ? "https" : "http";
	const init: RequestInit = {
		method: req.method,
		headers: flattenHeaders(req.headers),
	};
	if (req.method !== "GET" && req.method !== "HEAD") {
		init.body = Readable.toWeb(req) as ReadableStream;
		// @ts-ignore duplex is required when streaming a body
		init.duplex = "half";
	}
	return new Request(`${protocol}://${host}${url}`, init);
}

async function sendResponse(response: Response, res: ServerResponse): Promise<void> {
	res.statusCode = response.status;
	response.headers.forEach((value, key) => res.setHeader(key, value));
	if (!response.body) {
		res.end();
		return;
	}
	Readable.fromWeb(response.body as unknown as import("node:stream/web").ReadableStream).pipe(res);
}
