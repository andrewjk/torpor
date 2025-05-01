import torpor from "@torpor/unplugin/vite";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { build, defineConfig } from "vite";
import Site from "./Site.ts";
import manifest from "./manifest.ts";

// TODO: Don't cache index.html in dev?
// TODO: Multiple hook.server locations
// TODO: Don't reload layouts during client routing
// TODO: Call the correct +page and +server routes when in the same folder

export default async function runBuild(site: Site): Promise<void> {
	// Delete the dist folder if it exists
	const distFolder = path.resolve(site.root, "dist");
	if (existsSync(distFolder)) {
		await fs.rm(distFolder, { recursive: true });
	}
	const clientFolder = path.join(distFolder, "client");
	const serverFolder = path.join(distFolder, "server");

	// HOOK: Prebuild
	if (site.adapter.prebuild) {
		await site.adapter.prebuild(site);
	}

	// TODO: From a setting
	let siteHtml = path.resolve(site.root, "src/site.html");

	// TODO: Is this going to be the correct path after installing from npm?
	const siteFolder = path.resolve(site.root, "./node_modules/@torpor/build/src/site/");
	let clientScript = path.join(siteFolder, "clientEntry.ts");
	let serverScript = path.join(siteFolder, "serverEntry.ts");

	// Build the client assets, including site.html and the route files
	// EXCLUDING anything with `server.js` in the name
	await build(
		defineConfig({
			plugins: [manifest(site), torpor(), ...site.plugins],
			build: {
				outDir: clientFolder,
				rollupOptions: {
					input: [
						siteHtml,
						clientScript,
						...site.routes
							.filter((r) => !/server\.(ts|js)$/.test(r.file))
							.map((r) => path.resolve(site.root, r.file)),
						...site.inputs.filter((f) => !/server\.(ts|js)$/.test(f)),
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
			plugins: [manifest(site, true), torpor(), ...site.plugins],
			build: {
				outDir: serverFolder,
				rollupOptions: {
					input: [
						serverScript,
						...site.routes.map((r) => path.resolve(site.root, r.file)),
						...site.inputs,
					],
				},
				ssr: serverScript,
			},
		}),
	);

	// Move the site.html file into /client
	// HACK: Should do this in Rollup if possible?
	siteHtml = path.join(clientFolder, "site.html");
	await fs.rename(path.join(clientFolder, "src", "site.html"), siteHtml);
	await fs.rm(path.join(clientFolder, "src"), { recursive: true });

	// HOOK: Postbuild
	if (site.adapter.postbuild) {
		await site.adapter.postbuild(site);
	}
}
