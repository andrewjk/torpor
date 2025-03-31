import torpor from "@torpor/unplugin/vite";
import { configDotenv } from "dotenv";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, defineConfig } from "vite";
import createNodeServer from "../adapters/node/createNodeServer.ts";
import { serverError } from "../response.ts";
import Server from "../server/Server.ts";
import contentType from "../server/contentType.ts";
import Site from "./Site.ts";
import manifest from "./manifest.ts";
import prepareTemplate from "./prepareTemplate.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function runBuild(site: Site) {
	// Delete the dist folder if it exists
	const distFolder = path.resolve(site.root, "dist");
	if (existsSync(distFolder)) {
		await fs.rm(distFolder, { recursive: true });
	}
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");

	// TODO: From a setting
	let siteHtml = path.resolve(site.root, "src/site.html");

	let clientScriptFile = path.resolve(__dirname, "../../src/site/clientEntry.ts");
	let serverScriptFile = path.resolve(__dirname, "../../src/site/serverEntry.ts");

	// Build the client assets, including site.html and the route files
	// EXCLUDING anything with `server.js` in the name
	await build(
		defineConfig({
			plugins: [
				manifest(site),
				// @ts-ignore
				torpor(),
				...site.plugins,
			],
			build: {
				outDir: clientFolder,
				rollupOptions: {
					input: [
						siteHtml,
						clientScriptFile,
						...site.routes
							.filter((r) => !/server\.(ts|js)$/.test(r.file))
							.map((r) => path.resolve(site.root, r.file)),
					],
				},
				ssrManifest: true,
			},
		}),
	);

	// Build the server assets, including the server entry script and the route
	// files
	await build(
		defineConfig({
			plugins: [
				manifest(site, true),
				// @ts-ignore
				torpor(),
				...site.plugins,
			],
			build: {
				outDir: serverFolder,
				rollupOptions: {
					input: [serverScriptFile, ...site.routes.map((r) => path.resolve(site.root, r.file))],
				},
				ssr: serverScriptFile,
			},
		}),
	);

	// Move the site.html file into /client
	// HACK: Should do this in Rollup if possible?
	siteHtml = path.join(clientFolder, "site.html");
	await fs.rename(path.join(clientFolder, "src", "site.html"), siteHtml);
	await fs.rm(path.join(clientFolder, "src"), { recursive: true });

	// Find the client script file in /assets
	let clientScriptName = (await fs.readdir(path.join(clientFolder, "assets"))).find((f) =>
		f.startsWith("clientEntry-"),
	);
	if (!clientScriptName) {
		throw new Error("clientEntry.js not found");
	}
	clientScriptFile = `/assets/${clientScriptName}`;

	const server = new Server();

	//const vite = await createViteServer({
	//	...
	//});

	// Read site.html
	// It's called site.html because @torpor/build builds the site (html, routes
	// etc) while the user builds the app (components etc)
	let template = await fs.readFile(siteHtml, "utf-8");

	//template = await vite.transformIndexHtml("", template);

	// Prepare site.html so that we can just splice components into it
	template = prepareTemplate(template, clientScriptFile);

	//server.use(createMiddlewareHandler(vite.middlewares));

	// Serve dist/client/assets statically
	server.add("/assets/*", async (ev) => {
		try {
			const url = new URL(ev.request.url);
			const file = path.join(site.root, "dist", "client", url.pathname);
			if (existsSync(file)) {
				// TODO: Stream the data?
				return new Response(await fs.readFile(file), {
					status: 200,
					headers: {
						"Content-Type": contentType(path.extname(file)),
					},
				});
			}
			//}
		} catch (e: any) {
			return serverError(e);
		}
	});

	// Every request (GET, POST, etc) goes through loadEndPoint
	const serverScript = path.resolve(serverFolder, "serverEntry.js");
	server.add("*", async (ev) => {
		try {
			// Load the server entry
			const { load } = await import(serverScript);

			// Render the app HTML (or fetch server data etc) via serverEntry's
			// exported `load` function
			return await load(ev, template);
		} catch (e: any) {
			//vite.ssrFixStacktrace(e);
			return serverError(e);
		}
	});

	// Load environment variables from a `.env` file, with defaults if not set
	configDotenv();

	process.env.PROTOCOL ??= "http:";
	process.env.HOST ??= "localhost";
	process.env.PORT ??= "7059";

	// Create the server and start listening
	console.log(`\nConnecting to ${process.env.HOST}:${process.env.PORT}`);
	// TODO: Not node!
	const buildServer = createNodeServer(server.fetch);
	buildServer.listen(parseInt(process.env.PORT), process.env.HOST, () => {
		console.log(`Listening on ${process.env.HOST}:${process.env.PORT}\n`);
	});
}
