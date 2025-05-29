import { type Adapter, Site } from "@torpor/build";
import { promises as fs } from "node:fs";
import path from "node:path";
import { build, defineConfig } from "vite";
import prepareTemplate from "./prepareTemplate";

export default {
	postbuild,
	serve: (/* server: Server, site: Site*/) => {
		console.log("TODO: Cloudflare dev server");
	},
} satisfies Adapter as Adapter;

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

	const cloudflareConfig = structuredClone(site.viteConfig ?? {});
	cloudflareConfig.build ??= {};
	cloudflareConfig.build.outDir = cloudflareFolder;
	cloudflareConfig.build.rollupOptions ??= {};
	cloudflareConfig.build.rollupOptions.input = [workerFile, ...site.inputs];
	cloudflareConfig.build.rollupOptions.output = {
		entryFileNames: `[name].js`,
		chunkFileNames: `[name].js`,
		assetFileNames: `[name].[ext]`,
	};
	cloudflareConfig.build.rollupOptions.preserveEntrySignatures = "strict";
	// HACK: We don't need to minify as the worker isn't downloaded?
	// And it makes debugging easier
	cloudflareConfig.build.minify = false;
	// HACK: Build for SSR so we don't get document and window references
	cloudflareConfig.build.ssr = true;
	await build(defineConfig(cloudflareConfig));

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

	// Build a .assetsignore file
	const assetsIgnore = `
**/node_modules
**/.DS_Store
**/.git
_worker.js
`;
	const assetsIgnoreFile = path.join(cloudflareFolder, ".assetsignore");
	await fs.writeFile(assetsIgnoreFile, assetsIgnore);

	await fs.rm(tempFolder, { recursive: true });
}
