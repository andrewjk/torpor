import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, defineConfig } from "vite";
import Site from "../../site/Site";
import prepareTemplate from "../../site/prepareTemplate";
import type Adapter from "../../types/Adapter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	postbuild,
	serve: (/* server: Server, site: Site*/) => {
		console.log("TODO");
	},
} satisfies Adapter;

async function postbuild(site: Site) {
	// Build _worker.js as per
	// https://developers.cloudflare.com/pages/functions/advanced-mode/

	const distFolder = path.resolve(site.root, "dist");
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");
	const tempFolder = path.join(distFolder, "temp");
	const cloudflareFolder = path.join(distFolder, "cloudflare");

	// Compile _worker.ts
	let workerFile = path.resolve(__dirname, "../../../src/adapters/cloudflare/_worker.ts");
	let workerSource = await fs.readFile(workerFile, "utf-8");

	// Find the client script file in /assets
	let clientScript = (await fs.readdir(path.join(clientFolder, "assets"))).find((f) =>
		f.startsWith("clientEntry-"),
	);
	if (!clientScript) {
		throw new Error("clientEntry.js not found");
	}
	clientScript = `/assets/${clientScript}`;

	// Read and prepare site.html so that we can just splice components into it
	let siteHtml = path.join(clientFolder, "site.html");
	let template = await fs.readFile(siteHtml, "utf-8");
	template = prepareTemplate(template, clientScript);

	const serverClass = path.resolve(__dirname, "../../../src/server/Server.ts");
	const serverScript = path.join(serverFolder, "serverEntry.js");

	// Splice file names into _worker.ts
	//let workerSource = await fs.readFile(workerFile, "utf-8");
	workerSource = workerSource
		.replace("%SERVER_CLASS%", serverClass)
		.replace("%SERVER_SCRIPT%", serverScript)
		.replace("%HTML_TEMPLATE%", template);

	workerFile = path.join(tempFolder, "_worker.ts");
	await fs.mkdir(tempFolder);
	await fs.writeFile(workerFile, workerSource);

	await build(
		defineConfig({
			build: {
				outDir: cloudflareFolder,
				rollupOptions: {
					input: [workerFile],
					output: {
						entryFileNames: `[name].js`,
						chunkFileNames: `[name].js`,
						assetFileNames: `[name].[ext]`,
					},
					preserveEntrySignatures: "strict",
				},
				// HACK: We don't need to minify as the worker isn't downloaded?
				// And it makes debugging easier
				minify: false,
				// HACK: Disable preload so that the _worker.js file doesn't end
				// up with document and window references that are not available
				modulePreload: false,
			},
		}),
	);
	workerFile = path.join(distFolder, "cloudflare", "_worker.js");

	// Build a wrangler.json file for running with `wrangler dev`
	const wranglerConfig = {
		name: "torpor-miniflare",
		main: "cloudflare/_worker.js",
		compatibility_date: "2025-01-01",
		assets: {
			directory: "./client",
			binding: "ASSETS",
		},
	};
	const wranglerFile = path.join(distFolder, "wrangler.json");
	await fs.writeFile(wranglerFile, JSON.stringify(wranglerConfig, null, 2).replaceAll("  ", "\t"));

	await fs.rm(tempFolder, { recursive: true });
}
