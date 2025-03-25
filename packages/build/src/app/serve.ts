import torpor from "@torpor/unplugin/vite";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { type ViteDevServer } from "vite";
import createMiddlewareHandler from "../adapters/node/createMiddlewareHandler.ts";
import createNodeServer from "../adapters/node/createNodeServer.ts";
import { serverError } from "../response.ts";
import Server from "../server/Server.ts";
import ServerEvent from "../server/ServerEvent.ts";
import App from "./App.ts";
import manifest from "./manifest.ts";

// const PROD = process.env.NODE_ENV === "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

runServer();

async function runServer() {
	const options = { server: true };

	const app = new App();

	// This should get done outside the library
	//app.addRoute("/", "./src/app/routes/counter.ts");
	//app.addRoute("/about", "./src/app/routes/about.ts");

	app.addRouteFolder("routes");

	const server = new Server();

	// Create the Vite server in middleware mode and configure the app type as
	// "custom", disabling Vite's own HTML serving logic so the parent server
	// can take control
	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: "custom",
		plugins: [manifest(app), torpor(options)],
	});

	// Read index.html
	const clientScript = "/src/app/entryClient.ts";
	const templateFile = path.resolve(__dirname, "index.html");
	let template = await fs.readFile(templateFile, "utf-8");

	// Apply Vite HTML transforms. This injects the Vite HMR client, and also
	// applies HTML transforms from Vite plugins. Note that we only support a
	// universal transform, not individual transforms for each route
	template = await vite.transformIndexHtml("", template);

	// Prepare index.html up so that we can just splice components into it
	let contentStart = regexIndexOf(template, /\<div\s+id=("app"|'app'|app)\s+/);
	contentStart = template.indexOf(">", contentStart) + 1;
	let contentEnd = template.indexOf("</div>", contentStart);
	if (contentStart === -1 || contentEnd === -1) {
		throw new Error(`Couldn't find <div id="app"></div>`);
	}
	template =
		template.substring(0, contentStart) +
		"%COMPONENT_HTML%" +
		template.substring(contentEnd) +
		`<script type="module" src="${clientScript}"></script>`;

	// Use vite's connect instance as middleware
	server.use(createMiddlewareHandler(vite.middlewares));

	// Any request goes through loadEndPoint
	server.get("*", async (ev) => {
		try {
			const response = await loadEndPoint(ev, vite, template);

			// HACK: turn off SSR after this so that we can hydrate
			// Instead we need different routers like Vinxi has?
			// Or somehow indicate to the router that we are server/client?
			// Headers maybe???
			options.server = false;

			return response;
		} catch (e: any) {
			// If an error is caught, let Vite fix the stack trace so it maps
			// back to your actual source code
			vite.ssrFixStacktrace(e);
			return serverError(e);
		}
	});

	// Set up our app's endpoint routing
	//app.addPage("/", "./routes/counter.ts");
	//app.addPage("/about", "./routes/about.ts");

	// Create the Node server and start listening
	const port = 3000;
	const host = "127.0.0.1";
	const node = createNodeServer(server.fetch);
	node.listen(port, host, () => {
		console.log(`Listening on ${host}:${port}`);
	});
}

// TODO: Cache the HTML, pass the HTML in to entryServer.ts
// Figure out some way to only pass it in when necessary

async function loadEndPoint(ev: ServerEvent, vite: ViteDevServer, template: string) {
	const serverScript = "/src/app/entryServer.ts";

	// Load the server entry. ssrLoadModule automatically transforms ESM
	// source code to be usable in Node.js. No bundling is required, and
	// it provides efficient invalidation similar to HMR
	const { renderLocation } = await vite.ssrLoadModule(serverScript);

	// Render the app HTML via entryServer's exported `render` function
	const appHtml = await renderLocation(ev);

	// Inject the app-rendered HTML into the template
	const html = template.replace("%COMPONENT_HTML%", appHtml);

	// Send the rendered HTML back
	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html",
		},
	});
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
