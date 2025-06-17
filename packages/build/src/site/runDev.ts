import estorpor from "@torpor/unplugin/esbuild";
import torpor from "@torpor/unplugin/vite";
import { configDotenv } from "dotenv";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { serverError } from "../response.ts";
import Server from "../server/Server.ts";
import connectMiddleware from "../server/connect/connectMiddleware.ts";
import Site from "./Site.ts";
import manifest from "./manifest.ts";
import prepareTemplate from "./prepareTemplate.ts";

export default async function runDev(site: Site): Promise<void> {
	const server = new Server();

	// Create the Vite server in middleware mode and configure the app type as
	// "custom", disabling Vite's own HTML serving logic so the parent server
	// can take control
	const config = structuredClone(site.viteConfig ?? {});
	config.server = { middlewareMode: true };
	config.appType = "custom";
	config.plugins = [manifest(site, true), torpor(), ...site.plugins];

	// HACK: To be able to import `.torp` files from barrel files in
	// node_modules, we need to add their libraries to `ssr.noExternal` in
	// site.config.ts, and let esbuild know how to compile them here
	config.optimizeDeps ??= {};
	config.optimizeDeps.extensions ??= [];
	config.optimizeDeps.extensions.push(".torp");
	config.optimizeDeps.esbuildOptions ??= {};
	config.optimizeDeps.esbuildOptions.plugins ??= [];
	config.optimizeDeps.esbuildOptions.plugins.push(estorpor());

	const vite = await createViteServer(config);

	// Read site.html
	// It's called site.html because @torpor/build builds the site (html, routes
	// etc) while the user builds the app (components etc)
	const templateFile = path.resolve(site.root, "src/site.html");
	let template = await fs.readFile(templateFile, "utf-8");

	// Apply Vite HTML transforms. This injects the Vite HMR client, and also
	// applies HTML transforms from Vite plugins. Note that we only support a
	// universal transform, not individual transforms for each route
	template = await vite.transformIndexHtml("", template);

	// TODO: Is this going to be the correct path after installing from npm?
	const siteFolder = path.resolve(site.root, "./node_modules/@torpor/build/src/site/");
	let clientScript = path.join(siteFolder, "clientEntry.ts");
	let serverScript = path.join(siteFolder, "serverEntry.ts");

	// Prepare site.html so that we can just splice components into it
	template = prepareTemplate(template, clientScript);

	// Use Vite's Connect instance as middleware. We need to wrap it with
	// createMiddlewareHandler that converts Connect middleware to
	// Request/Response web handlers
	server.use(connectMiddleware(vite.middlewares));

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

	// Load environment variables from a `.env` file, with defaults if not set
	configDotenv();

	process.env.PROTOCOL ??= "http:";
	process.env.HOST ??= "localhost";
	process.env.PORT ??= "7059";

	// Serve the site
	site.adapter.serve(server, site);
}
