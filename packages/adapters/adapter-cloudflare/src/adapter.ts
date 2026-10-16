import { type Adapter, Site } from "@torpor/build";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { build, defineConfig } from "vite";
import { detectSourceMode, serverClassPath } from "./entryPaths";
import cloudflareDev from "./cloudflareDev";
import prepareTemplate from "./prepareTemplate";

export default {
	postbuild,
	dev: (site: Site) => cloudflareDev(site),
	serve: (_server, site: Site) => {
		// Preview the built Cloudflare worker (from postbuild) with `wrangler dev`
		// rather than a Node server, so preview matches production (workerd).
		const configPath = path.join(site.outputFolder, "wrangler.toml");
		const args = ["dev", "--config", configPath];

		// Resolve the wrangler bin from the consuming site's node_modules; fall
		// back to `wrangler` on PATH (e.g. when run via a package manager).
		let child;
		try {
			const require = createRequire(path.join(site.root, "package.json"));
			const wranglerBin = require.resolve("wrangler/bin/wrangler.js");
			child = spawn(process.execPath, [wranglerBin, ...args], {
				stdio: "inherit",
				cwd: site.root,
			});
		} catch {
			child = spawn("wrangler", args, { stdio: "inherit", cwd: site.root });
		}
		child.on("exit", (code) => process.exit(code ?? 0));
	},
} satisfies Adapter as Adapter;

async function postbuild(site: Site): Promise<void> {
	// Build _worker.js as per
	// https://developers.cloudflare.com/pages/functions/advanced-mode/

	const distFolder = site.outputFolder;
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");
	const tempFolder = path.join(distFolder, "temp");
	const cloudflareFolder = path.join(distFolder, "cloudflare");

	const sourceMode = detectSourceMode(site.root);
	const adapterDistFolder = path.resolve(
		site.root,
		"./node_modules/@torpor/adapter-cloudflare/dist/",
	);

	// Compile _worker.ts
	let workerFile = path.join(adapterDistFolder, "_worker.ts");
	let workerSource = await fs.readFile(workerFile, "utf-8");

	// Read and prepare site.html so that we can just splice components into it.
	// An endpoints-only site has no site.html, and no template is needed
	let template: string | undefined;
	const siteHtml = path.join(clientFolder, "site.html");
	if (existsSync(siteHtml)) {
		let clientScript = (await fs.readdir(path.join(clientFolder, "assets"))).find((f) =>
			f.startsWith("clientEntry-"),
		);
		if (!clientScript) {
			throw new Error("clientEntry.js not found");
		}
		clientScript = `/assets/${clientScript}`;

		template = prepareTemplate(await fs.readFile(siteHtml, "utf-8"), clientScript);
	}

	const serverClass = serverClassPath(site.root, sourceMode);
	const serverScript = path.join(serverFolder, "serverEntry.js");

	// Splice file names into _worker.ts
	workerSource = workerSource
		.replace("%SERVER_CLASS%", serverClass)
		.replace("%SERVER_SCRIPT%", serverScript)
		.replace("`%HTML_TEMPLATE%`", () => (template ? JSON.stringify(template) : "undefined"));

	workerFile = path.join(tempFolder, "_worker.ts");
	await fs.mkdir(tempFolder);
	await fs.writeFile(workerFile, workerSource);

	const cloudflareConfig = structuredClone(site.viteConfig ?? {});
	cloudflareConfig.build ??= {};
	cloudflareConfig.build.outDir = cloudflareFolder;
	cloudflareConfig.build.rollupOptions ??= {};
	cloudflareConfig.build.rollupOptions.input = [workerFile, ...site.inputs];
	// Keep the worker entry at the Cloudflare folder root -- wrangler configs
	// point `main` at `./cloudflare/_worker.js` -- and nest the rest of the
	// server bundle under `_server/`. That frees the folder root for the
	// client's public files and prerendered HTML (see the copy below), which
	// share this directory because it doubles as `assets.directory`
	cloudflareConfig.build.rollupOptions.output = {
		entryFileNames: (chunk) => (chunk.name === "_worker" ? "_worker.js" : `_server/[name].js`),
		chunkFileNames: `_server/[name].js`,
		assetFileNames: `_server/[name].[ext]`,
	};
	cloudflareConfig.build.rollupOptions.preserveEntrySignatures = "strict";
	// HACK: We don't need to minify as the worker isn't downloaded?
	// And it makes debugging easier
	cloudflareConfig.build.minify = false;
	// HACK: Build for SSR so we don't get document and window references
	cloudflareConfig.build.ssr = true;
	await build(defineConfig(cloudflareConfig));

	// Copy the client output into the Cloudflare folder. The hashed bundle
	// goes under `assets/`; everything the build wrote at the client root --
	// public files from `src/public`, prerendered HTML, `sitemap.xml` -- is
	// copied to the matching root paths, since this folder doubles as
	// `assets.directory` and Cloudflare serves assets before the worker.
	// (`site.html` and Vite's `.vite` cache aren't needed at runtime.)
	await copyClientOutput(clientFolder, cloudflareFolder);

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

	// Build a .assetsignore file.
	//
	// The only server code in `cloudflareFolder` outside `_server/` is the
	// `_worker.js` entry. Everything else at the root is client output
	// (public files, prerendered HTML, `assets/`) that Cloudflare should
	// serve, so the worker's own output is all that gets ignored.
	const assetsIgnore = `
**/node_modules
**/.DS_Store
**/.git
_worker.js
_server
`;
	const assetsIgnoreFile = path.join(cloudflareFolder, ".assetsignore");
	await fs.writeFile(assetsIgnoreFile, assetsIgnore);

	await fs.rm(tempFolder, { recursive: true });
}

/** Client-output entries that aren't copied into the Cloudflare folder. */
const SKIP_CLIENT_ROOT = new Set(["assets", "site.html", ".vite", ".DS_Store"]);

/** Cloudflare-folder paths reserved for the adapter's own worker output. */
const RESERVED_CLOUDFLARE_PATHS = ["_worker.js", "_server"];

async function copyClientOutput(clientFolder: string, cloudflareFolder: string): Promise<void> {
	for (const reserved of RESERVED_CLOUDFLARE_PATHS) {
		if (existsSync(path.join(clientFolder, reserved))) {
			throw new Error(
				`The client output contains "${reserved}", which is reserved by ` +
					`@torpor/adapter-cloudflare for the Cloudflare worker's own output`,
			);
		}
	}
	await copyDir(path.join(clientFolder, "assets"), path.join(cloudflareFolder, "assets"));
	await copyDir(clientFolder, cloudflareFolder, SKIP_CLIENT_ROOT);
}

async function copyDir(from: string, to: string, skip: Set<string> = new Set()): Promise<void> {
	await fs.mkdir(to, { recursive: true });
	for (const entry of await fs.readdir(from, { withFileTypes: true })) {
		if (skip.has(entry.name)) continue;
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			await copyDir(src, dest);
		} else {
			await fs.copyFile(src, dest);
		}
	}
}
