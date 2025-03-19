import torpor from "@torpor/unplugin/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import App from "./App";
import createMiddlewareHandler from "./adapters/node/createMiddlewareHandler";
import createNodeServer from "./adapters/node/createNodeServer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
	const app = new App();

	const options = { server: true };

	// Create the Vite server in middleware mode and configure the app type as
	// 'custom', disabling Vite's own HTML serving logic so the parent server
	// can take control
	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: "custom",
		plugins: [torpor(options)],
	});

	// Use vite's connect instance as middleware
	app.use(createMiddlewareHandler(vite.middlewares));

	app.use(
		//"*",
		async (ev, next) => {
			// we should only get here once!
			//console.log("HERE WE GO", ev.request.url);
			//const url = req.originalUrl;

			try {
				const templateFile = path.resolve(__dirname, "index.html");
				const clientScript = "/src/app/entryClient.ts";
				const serverScript = "/src/app/entryServer.ts";

				// Read index.html
				let template = fs.readFileSync(templateFile, "utf-8");

				// Apply Vite HTML transforms. This injects the Vite HMR client, and
				// also applies HTML transforms from Vite plugins
				template = await vite.transformIndexHtml(ev.request.url, template);

				// Load the server entry. ssrLoadModule automatically transforms ESM
				// source code to be usable in Node.js. No bundling is required, and
				// it provides efficient invalidation similar to HMR
				const { render } = await vite.ssrLoadModule(serverScript);

				// Render the app HTML via entryServer's exported `render` function
				const appHtml = await render(ev);

				// Inject the app-rendered HTML and client scripts into the template
				// TODO: Manifest?
				let contentStart = regexIndexOf(template, /\<div\s+id=("app"|'app'|app)\s+/);
				contentStart = template.indexOf(">", contentStart) + 1;
				let contentEnd = template.indexOf("</div>", contentStart);
				if (contentStart === -1 || contentEnd === -1) {
					throw new Error(`Couldn't find <div id="app"></div>`);
				}
				const html =
					template.substring(0, contentStart) +
					appHtml +
					template.substring(contentEnd) +
					`<script type="module" src="${clientScript}"></script>`;

				// HACK: turn off SSR after this so that we can hydrate
				// Instead we need different routers like Vinxi has?
				// Or somehow indicate to the router that we are server/client?
				// Headers maybe???
				options.server = false;

				// Send the rendered HTML back
				//res.status(200).set({ "Content-Type": "text/html" }).end(html);
				ev.response = new Response(html, {
					status: 200,
					headers: {
						"Content-Type": "text/html",
					},
				});
			} catch (e: any) {
				// If an error is caught, let Vite fix the stack trace so it maps
				// back to your actual source code
				vite.ssrFixStacktrace(e);
				next(e);
			}
		},
	);

	// Create the server and start listening
	const port = 3000;
	const host = "127.0.0.1";
	const server = createNodeServer(app.fetch);
	server.listen(port, host, () => {
		console.log(`Listening on ${host}:${port}`);
	});
}

createServer();

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
