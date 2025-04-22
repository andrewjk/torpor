import { type Adapter, Site } from "@torpor/build";
import { promises as fs } from "node:fs";
import path from "node:path";
import { build, defineConfig } from "vite";
import prepareTemplate from "./prepareTemplate";

const adapter: Adapter = {
	postbuild,
	serve: (/* server: Server, site: Site*/) => {
		console.log("TODO");
	},
};

export default adapter;

async function postbuild(site: Site): Promise<void> {
	// Build _worker.js as per
	// https://developers.cloudflare.com/pages/functions/advanced-mode/

	const distFolder = path.resolve(site.root, "dist");
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");
	const tempFolder = path.join(distFolder, "temp");
	const cloudflareFolder = path.join(distFolder, "cloudflare");

	// TODO: Is this going to be the correct path after installing from npm?
	const buildSrcFolder = path.resolve(site.root, "./node_modules/@torpor/build/src/");
	const adapterSrcFolder = path.resolve(
		site.root,
		"./node_modules/@torpor/adapter-cloudflare/src/",
	);

	// Compile _worker.ts
	let workerFile = path.join(adapterSrcFolder, "_worker.ts");
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

	const serverClass = path.join(buildSrcFolder, "server", "Server.ts");
	const serverScript = path.join(serverFolder, "serverEntry.js");

	// Splice file names into _worker.ts
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

	// HACK: Disabling preload doesn't work so we have to brute-force it???
	for (let file of await fs.readdir(cloudflareFolder)) {
		if (file.startsWith("_worker")) {
			let b = await fs.readFile(path.join(cloudflareFolder, file), "utf-8");
			if (b.includes("const __vitePreload")) {
				b = b.replaceAll(
					"const __vitePreload = function preload(baseModule, deps, importerUrl) {",
					"const __vitePreload = function preload(baseModule, deps, importerUrl) { return baseModule();",
				);
				await fs.writeFile(path.join(cloudflareFolder, file), b);
			}
		}
	}

	// Copy the client assets into the Cloudflare folder
	await fs.mkdir(path.join(cloudflareFolder, "assets"));
	for (let file of await fs.readdir(path.join(clientFolder, "assets"))) {
		await fs.copyFile(
			path.join(clientFolder, "assets", file),
			path.join(cloudflareFolder, "assets", file),
		);
	}

	// Build a wrangler.toml file for running with `wrangler dev`
	const wranglerConfig = `
name = "torpor-miniflare"
main = "./cloudflare/_worker.js"
compatibility_date = "2025-01-01"

[assets]
directory = "./cloudflare"
binding = "ASSETS"
	`;
	const wranglerFile = path.join(distFolder, "wrangler.toml");
	await fs.writeFile(wranglerFile, wranglerConfig);

	await fs.rm(tempFolder, { recursive: true });
}
