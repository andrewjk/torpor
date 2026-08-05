import estorpor from "@torpor/unplugin/esbuild";
import torpor from "@torpor/unplugin/vite";
import { configDotenv } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { type AliasOptions, createServer as createViteServer, type Plugin } from "vite";
import Site from "../site/Site.ts";
import manifest from "../site/manifest.ts";
import devPlugin from "./devPlugin.ts";

export default async function runDev(site: Site): Promise<void> {
	// Create the Vite dev server. Unlike the previous middleware-mode setup, we
	// let Vite own the HTTP server (so HMR/websockets work natively) and let the
	// adapter's `dev()` plugin(s) handle SSR via configureServer.
	const config = structuredClone(site.viteConfig ?? {});
	config.appType = "custom";
	config.server ??= {};
	config.server.host ??= "localhost";
	config.server.port ??= 7059;
	// Resolve tsconfig path aliases (e.g. `@/*`). Previously provided by the
	// default `vite-tsconfig-paths` plugin on Site; vite-plus handles it inline
	config.resolve ??= {};
	config.resolve.tsconfigPaths ??= true;
	// vite-plus' `tsconfigPaths` isn't honored by the SSR module-runner's
	// externalization path (it hardcodes tsconfigPaths:false), so dev SSR can't
	// resolve path aliases. Mirror tsconfig `compilerOptions.paths` as Vite
	// `resolve.alias` so they resolve during transform for both client and SSR.
	config.resolve.alias = [...asAliasArray(config.resolve.alias), ...tsconfigAliases(site.root)];

	// The adapter provides the dev-runtime plugin(s); fall back to the
	// framework's Node-runtime plugin when it doesn't.
	const adapterDev = site.adapter.dev?.(site);
	const devPlugins = normalizePlugins(adapterDev ?? devPlugin(site));

	config.plugins = [manifest(site, true), torpor({ dev: true }), ...devPlugins, ...site.plugins];

	// HACK: To be able to import `.torp` files from barrel files in
	// node_modules, we need to add their libraries to `ssr.noExternal` in
	// site.config.ts, and let esbuild know how to compile them here
	config.optimizeDeps ??= {};
	config.optimizeDeps.extensions ??= [];
	config.optimizeDeps.extensions.push(".torp");
	config.optimizeDeps.rolldownOptions ??= {};
	config.optimizeDeps.rolldownOptions.plugins ??= [estorpor()];
	// TODO: config.optimizeDeps.rolldownOptions.plugins.push(estorpor());

	// Load environment variables from a `.env` file, with defaults if not set
	configDotenv();

	process.env.PROTOCOL ??= "http:";
	process.env.HOST ??= "localhost";
	process.env.PORT ??= "7059";

	const connectingUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}`;
	console.log(`\nConnecting to ${connectingUrl}`);

	const vite = await createViteServer(config);
	await vite.listen();

	const listeningUrl = vite.resolvedUrls?.local?.[0] ?? connectingUrl;
	console.log(`Listening on ${listeningUrl}\n`);
}

function normalizePlugins(plugins: Plugin | Plugin[] | void): Plugin[] {
	if (!plugins) return [];
	return Array.isArray(plugins) ? plugins : [plugins];
}

type AliasEntry = { find: string | RegExp; replacement: string };

function asAliasArray(alias: AliasOptions | undefined): AliasEntry[] {
	// Normalize an existing `resolve.alias` value (array | object | undefined)
	// into an array so we can concatenate our tsconfig-derived aliases.
	if (!alias) return [];
	if (Array.isArray(alias)) return alias;
	return Object.entries(alias).map(([find, replacement]) => ({ find, replacement }));
}

/**
 * Reads `tsconfig.json` `compilerOptions.paths` (relative to `baseUrl`,
 * defaulting to the tsconfig directory) and converts them to Vite
 * `resolve.alias` entries. Only handles paths declared in the root tsconfig
 * (not inherited via `extends`).
 */
function tsconfigAliases(root: string): AliasEntry[] {
	const file = path.join(root, "tsconfig.json");
	let paths: Record<string, string[]> | undefined;
	let baseUrl: string;
	try {
		const tsconfig = JSON.parse(stripJsonc(readFileSync(file, "utf-8")));
		const compilerOptions = tsconfig.compilerOptions ?? {};
		baseUrl = compilerOptions.baseUrl ? path.resolve(root, compilerOptions.baseUrl) : root;
		paths = compilerOptions.paths;
	} catch {
		return [];
	}
	if (!paths) return [];

	const aliases: AliasEntry[] = [];
	for (const [pattern, targets] of Object.entries(paths)) {
		const target = targets?.[0];
		if (!target) continue;
		if (pattern.endsWith("*")) {
			// `@/*` -> `./src/*`: match the literal prefix (`@/`) and rewrite to
			// the target dir. A string `find` is used (not a RegExp) because
			// Vite applies prefix-string aliases during SSR transform, which is
			// what makes path aliases resolve in the SSR module runner.
			const find = pattern.slice(0, -1);
			const targetDir = target.slice(0, -1);
			aliases.push({
				find,
				replacement: `${path.resolve(baseUrl, targetDir)}/`,
			});
		} else {
			aliases.push({ find: pattern, replacement: path.resolve(baseUrl, target) });
		}
	}
	return aliases;
}

/**
 * Strips JSONC comments and trailing commas so `tsconfig.json` (which permits
 * both) can be parsed with `JSON.parse`. String contents are preserved.
 */
function stripJsonc(text: string): string {
	let out = "";
	for (let i = 0; i < text.length;) {
		const c = text[i];
		if (c === '"' || c === "'") {
			const quote = c;
			out += c;
			i++;
			while (i < text.length) {
				if (text[i] === "\\") {
					out += text[i] + (text[i + 1] ?? "");
					i += 2;
					continue;
				}
				const cc = text[i++];
				out += cc;
				if (cc === quote) break;
			}
			continue;
		}
		if (c === "/" && text[i + 1] === "/") {
			i += 2;
			while (i < text.length && text[i] !== "\n") i++;
			continue;
		}
		if (c === "/" && text[i + 1] === "*") {
			i += 2;
			while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	return out.replace(/,(\s*[}\]])/g, "$1");
}
