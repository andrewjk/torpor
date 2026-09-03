import torpor from "@torpor/unplugin/vite";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { build, defineConfig, type AliasOptions } from "vite";
import Site from "../site/Site";
import { checkApiCalls, checkRoutes, reportRouteIssues } from "../site/checkRoutes";
import { checkLayoutSlots } from "../site/checkLayoutSlots";
import manifest from "../site/manifest.ts";
import tsconfigAliases, { type AliasEntry } from "../utils/tsconfigAliases";
import { addTorporPackageConfig } from "../utils/torporPackages";

// TODO: Don't cache index.html in dev?
// TODO: Don't reload layouts during client routing
// TODO: Call the correct +page and +server routes when in the same folder

export default async function runBuild(site: Site): Promise<void> {
	// Check route type annotations and makeApi calls against the routes
	// derived from file locations, and check that layouts render their slot;
	// errors fail the build before anything is written
	let errorCount = reportRouteIssues(checkRoutes(site));
	errorCount += reportRouteIssues(checkApiCalls(site));
	errorCount += reportRouteIssues(checkLayoutSlots(site));
	if (errorCount > 0) {
		throw new Error(
			`Route type check failed with ${errorCount} error${errorCount === 1 ? "" : "s"} (see above)`,
		);
	}

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
	// An endpoints-only site has no site.html, so everything template-related
	// is optional
	const siteHtml = path.resolve(site.root, "src/site.html");
	const hasSiteHtml = existsSync(siteHtml);

	const siteFolder = path.resolve(site.root, "./node_modules/@torpor/build/src/site/");
	let clientScript = path.join(siteFolder, "clientEntry.ts");
	let serverScript = path.join(siteFolder, "serverEntry.ts");

	// Build the client assets, including site.html and the route files
	// EXCLUDING anything with `server.js` in the name
	const clientConfig = structuredClone(site.viteConfig ?? {});
	// Resolve tsconfig path aliases (e.g. `@/*`). Previously provided by the
	// default `vite-tsconfig-paths` plugin on Site; vite-plus handles it inline
	// for the client, but hardcodes tsconfigPaths:false on the SSR
	// externalization path, so mirror tsconfig `compilerOptions.paths` as Vite
	// `resolve.alias` to resolve them during transform for both client and SSR
	clientConfig.resolve ??= {};
	clientConfig.resolve.tsconfigPaths ??= true;
	clientConfig.resolve.alias = [
		...asAliasArray(clientConfig.resolve.alias),
		...tsconfigAliases(site.root),
	];
	clientConfig.plugins = [manifest(site), torpor(), ...site.vitePlugins];
	clientConfig.build ??= {};
	clientConfig.build.outDir = clientFolder;
	clientConfig.build.rollupOptions ??= {};
	clientConfig.build.rollupOptions.input = [
		...(hasSiteHtml ? [siteHtml] : []),
		clientScript,
		...site.routes
			.filter((r) => r.file && !/server\.(ts|js)$/.test(r.file))
			.map((r) => path.resolve(site.root, r.file!)),
		...site.inputs.filter((f) => !/server\.(ts|js)$/.test(f)),
	];
	clientConfig.build.ssrManifest = true;
	await build(defineConfig(clientConfig));

	// Build the server assets, including the server entry script and the route
	// files
	const serverConfig = structuredClone(site.viteConfig ?? {});
	// Resolve tsconfig path aliases (e.g. `@/*`), as above
	serverConfig.resolve ??= {};
	serverConfig.resolve.tsconfigPaths ??= true;
	serverConfig.resolve.alias = [
		...asAliasArray(serverConfig.resolve.alias),
		...tsconfigAliases(site.root),
	];
	serverConfig.plugins = [manifest(site, true), torpor(), ...site.vitePlugins];
	serverConfig.build ??= {};
	serverConfig.build.outDir = serverFolder;
	// Bundle packages that ship `.torp` files into the server build, as they
	// need the torpor compiler (Node/workerd can't load them externalized)
	addTorporPackageConfig(site.root, serverConfig);
	serverConfig.build.rollupOptions ??= {};
	serverConfig.build.rollupOptions.input = [
		serverScript,
		...site.routes.filter((r) => r.file).map((r) => path.resolve(site.root, r.file!)),
		...site.inputs,
	];
	serverConfig.build.ssr = serverScript;
	await build(defineConfig(serverConfig));

	// Move the site.html file into /client
	// HACK: Should do this in Rollup if possible?
	if (hasSiteHtml) {
		await fs.rename(
			path.join(clientFolder, "src", "site.html"),
			path.join(clientFolder, "site.html"),
		);
		await fs.rm(path.join(clientFolder, "src"), { recursive: true });
	}

	// HOOK: Postbuild
	if (site.adapter.postbuild) {
		await site.adapter.postbuild(site);
	}
}

function asAliasArray(alias: AliasOptions | undefined): AliasEntry[] {
	// Normalize an existing `resolve.alias` value (array | object | undefined)
	// into an array so we can concatenate our tsconfig-derived aliases.
	if (!alias) return [];
	if (Array.isArray(alias)) return alias;
	return Object.entries(alias).map(([find, replacement]) => ({ find, replacement }));
}
