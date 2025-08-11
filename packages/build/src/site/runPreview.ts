import { configDotenv } from "dotenv";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { serverError } from "../response.ts";
import Server from "../server/Server.ts";
import contentType from "../server/contentType.ts";
import Site from "./Site";
import prepareTemplate from "./prepareTemplate.ts";
import runBuild from "./runBuild";

export default async function runPreview(site: Site): Promise<void> {
	// Build the site
	await runBuild(site);

	const distFolder = path.resolve(site.root, "dist");
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");

	// Find the client script file in /assets
	let clientScript = (await fs.readdir(path.join(clientFolder, "assets"))).find((f) =>
		f.startsWith("clientEntry-"),
	);
	if (!clientScript) {
		throw new Error("clientEntry.js not found");
	}
	clientScript = `/assets/${clientScript}`;

	// Read site.html
	// It's called site.html because @torpor/build builds the site (html, routes
	// etc) while the user builds the app (components etc)
	let siteHtml = path.join(clientFolder, "site.html");
	let template = await fs.readFile(siteHtml, "utf-8");

	// Prepare site.html so that we can just splice components into it
	template = prepareTemplate(template, clientScript);

	// Configure the server
	const server = new Server();

	// Serve dist/client/assets statically
	server.add("/assets/*", async (ev) => {
		try {
			const url = new URL(ev.request.url);
			const file = path.join(site.root, "dist", "client", url.pathname);
			if (existsSync(file)) {
				// TODO: Stream the data?
				const body = bufferToArrayBuffer(await fs.readFile(file));
				return new Response(body, {
					status: 200,
					headers: {
						"Content-Type": contentType(path.extname(file)),
					},
				});
			}
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

// From https://stackoverflow.com/a/79345620
// No idea why it is needed
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
	return buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength,
	) as ArrayBuffer;
}
