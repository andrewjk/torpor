import { type Template, build, parse } from "@torpor/view/compile";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { type UnpluginFactory, type UnpluginInstance } from "unplugin";
import { createUnplugin } from "unplugin";
import { transformWithOxc } from "vite";
import type Options from "./types";

/**
 * The scoped-style registry: `<hash>.css` -> CSS text. Populated as a side
 * effect of transforming a `.torp`, but `load` can also rebuild an entry from
 * source (see rebuildStyle) so that a request arriving in a fresh module graph
 * -- e.g. after Vite's optimizer invalidates everything and reloads -- is
 * still served instead of 404ing.
 */
const styles = new Map<string, string>();

/**
 * Scoped-style hashes that were looked up but not found in any source, so a
 * genuinely missing style isn't re-scanned on every request.
 */
const missing = new Set<string>();

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => ({
	name: "unplugin-torpor",
	resolveId(id /*, importer, options*/) {
		if (styles.has(id)) {
			return id;
		}
		// A request for a scoped style we haven't compiled this session: recover
		// its CSS from the source file instead of letting Vite 404 it
		if (SCOPED_CSS_RE.test(id) && rebuildStyle(id, options)) {
			return id;
		}
		return undefined;
	},
	load(id) {
		if (styles.has(id)) {
			return styles.get(id);
		}
		if (SCOPED_CSS_RE.test(id) && rebuildStyle(id, options)) {
			return styles.get(id);
		}
		return undefined;
	},
	transformInclude(id) {
		// Check for *.torp files (with or without a query)
		if (/\.torp([?#]|$)/.test(id)) {
			return true;
		}
		// Also plain-JS modules that are imported with an override query --
		// re-export barrels from torpor packages (e.g. the `index.js` files
		// that `@torpor/ui/*` resolves to), which need to pass the query on
		// to the `.torp` files they re-export
		const query = getQuery(id);
		if (query?.has("client") || query?.has("server")) {
			return /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx)$/.test(cleanId(id));
		}
		return false;
	},
	// @ts-ignore
	transform(code, id, viteOptions) {
		// Copy the factory options instead of mutating them, so that the
		// per-request dev/server overrides below don't stick around and
		// surprise the next request
		let transformOptions: Options = { ...options };

		// We may be in dev mode
		if (viteOptions && viteOptions.dev !== undefined) {
			transformOptions.dev = viteOptions.dev;
		}

		// An explicit ?client or ?server query on the import overrides
		// everything else -- e.g. importing `Component.torp?client` in a test
		// run compiles the component for the client, so that it can be
		// mounted, while other components stay SSR-compiled
		const override = getOverride(getQuery(id));
		if (override === "client") {
			transformOptions.server = false;
		} else if (override === "server") {
			transformOptions.server = true;
		} else {
			// Vite can override user server options
			if (viteOptions && viteOptions.ssr !== undefined) {
				transformOptions.server = viteOptions.ssr;
			}

			// But when testing we always generate for the server
			if (transformOptions.test) {
				transformOptions.server = true;
			}
		}

		// A plain-JS module with an override query (a re-export barrel from a
		// torpor package) doesn't get compiled as a component; it only needs
		// the query passed on to the `.torp` files it imports
		if (!/\.torp([?#]|$)/.test(id)) {
			if (!transformOptions.test || !override) {
				return undefined;
			}
			const rewritten = propagateOverride(code, override, path.dirname(cleanId(id)));
			return rewritten === code ? undefined : { code: rewritten, map: null };
		}

		// Try to parse the code
		let parsed = parse(code);
		if (parsed.ok && parsed.template) {
			// Transform for server or client
			return transform(parsed.template, id, transformOptions, override);
		} else {
			// Show an error component
			let name = id
				.split(/[\\/]/)
				.at(-1)
				.replace(/\.torp.*$/, "")!;
			let errorMessages = parsed.errors.map(
				(e) => `${e.startLine + 1},${e.startChar}: ${e.message}`,
			);
			console.log(`\nERRORS: ${id}\n======\n${errorMessages.join("\n")}`);
			let errorCode = `
export default function Error() {
	@render {
		<div style="background-color: #222; color: #f44"; font-size: 15px; line-height: 1.5;">
			<p style="margin: 0; padding: 0;">
				<strong>Error${parsed.errors.length === 1 ? "" : "s"} in ${name}:</strong>
			</p>
			<ul style="margin: 0; padding: 0 20px">
				${errorMessages.map((e) => `<li>${e}</li>`).join("\n")}
			</ul>
		</div>
	}
}`;
			let errorParsed = parse(errorCode);
			if (errorParsed.ok && errorParsed.template) {
				return transform(errorParsed.template, id, transformOptions, override);
			}
			// This should never be reached, but just in case...
			throw new Error(`Parse failed for ${id}, ${errorMessages.join("\n")}`);
		}
	},
});

/**
 * Gets the query string of a module id (e.g. `client` for `Foo.torp?client`)
 */
function getQuery(id: string): URLSearchParams | undefined {
	const queryStart = id.lastIndexOf("?");
	if (queryStart === -1) {
		return undefined;
	}
	return new URLSearchParams(id.substring(queryStart + 1));
}

/**
 * Gets the client/server override from a module id's query, if any
 */
function getOverride(query: URLSearchParams | undefined): "client" | "server" | undefined {
	if (query?.has("client")) {
		return "client";
	}
	if (query?.has("server")) {
		return "server";
	}
	return undefined;
}

/**
 * Gets the id without its query string (e.g. `Foo.torp` for `Foo.torp?client`)
 */
function cleanId(id: string): string {
	return id.replace(/[?#].*$/, "");
}

/**
 * Matches a scoped-style virtual module id (e.g. `/@id/1bapgxs.css`).
 */
const SCOPED_CSS_RE = /(?:^|\/)([a-z0-9]+)\.css$/;

/**
 * Populates the style registry from disk for `id`, returning whether the
 * entry is now present. This makes the CSS loadable even when the owning
 * `.torp` was compiled in an earlier module graph (whose transform side
 * effects are gone). It mirrors how vite-plugin-svelte's virtual-CSS `load`
 * re-derives content rather than trusting a transform-populated cache.
 */
function rebuildStyle(id: string, options: Options | undefined): boolean {
	const hash = id.match(SCOPED_CSS_RE)?.[1];
	if (hash === undefined) {
		return false;
	}
	if (missing.has(hash)) {
		return false;
	}
	// The project's own components are the common case, so look there first and
	// only fall back to installed torpor packages if the hash isn't found
	const found = findStyleIn([...projectTorpRoots(), ...packageTorpRoots()], hash, options);
	if (!found) {
		missing.add(hash);
	}
	return found;
}

/**
 * Searches each root in turn for the `.torp` whose `@style` block hashes to
 * `hash`, registering it when found. Stops at the first hit, so the (rarer)
 * package scan only runs when the app source doesn't own the style.
 */
function findStyleIn(roots: string[], hash: string, options: Options | undefined): boolean {
	for (const root of roots) {
		for (const file of torpFilesUnder(root)) {
			try {
				const template = parse(readFileSync(file, "utf8"));
				if (!template.ok || !template.template) {
					continue;
				}
				const built = build(template.template, { ...options, server: false });
				if (!built.styles) {
					continue;
				}
				for (const style of built.styles) {
					if (style.hash === hash) {
						styles.set(style.hash + ".css", style.style);
						return true;
					}
				}
			} catch {
				// A broken component is reported when it's actually rendered
			}
		}
	}
	return false;
}

/** The site's own source, walked as one root (excluding `node_modules`). */
function projectTorpRoots(): string[] {
	return [process.cwd()];
}

/**
 * The `dist` folders of installed torpor packages, where their `.torp` files
 * ship (e.g. `@torpor/ui`). Read from the site's `node_modules` links rather
 * than walking the whole store, which can be huge.
 */
function packageTorpRoots(): string[] {
	const roots: string[] = [];
	const torporScope = path.join(process.cwd(), "node_modules", "@torpor");
	let entries;
	try {
		entries = readdirSync(torporScope, { withFileTypes: true });
	} catch {
		return roots;
	}
	for (const entry of entries) {
		const dist = path.join(torporScope, entry.name, "dist");
		if (existsSync(dist)) {
			roots.push(dist);
		}
	}
	return roots;
}

/**
 * Every `.torp` file under `folder`, recursing but skipping `.git` and
 * `node_modules` (package roots are supplied separately by packageTorpRoots).
 */
function torpFilesUnder(folder: string): string[] {
	const files: string[] = [];
	const stack = [folder];
	while (stack.length > 0) {
		const dir = stack.pop()!;
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (entry.name === ".git" || entry.name === "node_modules") {
				continue;
			}
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile() && entry.name.endsWith(".torp")) {
				files.push(full);
			}
		}
	}
	return files;
}

function transform(
	template: Template,
	id: string,
	options?: Options,
	override?: "client" | "server",
) {
	const built = build(template, options);
	let transformed = built.code;

	// When a component is compiled with a ?client/?server override in a test
	// run, any child components it imports must be compiled the same way --
	// otherwise mounting the parent would try to render SSR children (which
	// don't show anything). Pass the override on to imported components:
	// relative `.torp` imports, and bare imports into packages that ship
	// `.torp` files (e.g. `@torpor/ui/*` or `phosphor-torpor/*`), whose
	// re-export barrels would otherwise be compiled for the default side
	if (options?.test && override) {
		transformed = propagateOverride(transformed, override, path.dirname(cleanId(id)));
	}

	if (built.styles) {
		for (let style of built.styles) {
			// Add a dynamic import for the component's CSS with a name from
			// the hash and add the styles to a map. Then resolveId will
			// pass the CSS id onto load, which will load the the actual CSS
			// from the map
			transformed = `import '${style.hash}.css';\n` + transformed;
			styles.set(style.hash + ".css", style.style);
		}
	}

	//printTransformed(transformed);

	// TODO: Compile typescript only if script lang="ts" or config.lang="ts"
	return transformWithOxc(transformed, id.replace(/\.torp.*$/, ".ts"));
}

/**
 * Rewrites a component's imports so that the components it imports get the
 * same `?client`/`?server` override:
 *
 * - relative `.torp` imports get the query appended
 * - bare package imports that resolve into a torpor package (one that ships
 *   `.torp` files, e.g. `@torpor/ui/Progress` or `phosphor-torpor/lib/Camera`)
 *   get the query appended too -- their specifiers don't end in `.torp`, but
 *   they resolve to `.torp` files (directly or through plain-JS re-export
 *   barrels), so without the query they'd be compiled for the default side
 */
function propagateOverride(
	code: string,
	override: "client" | "server",
	importerDir: string,
): string {
	let result = code;

	// Relative (or bare-but-.torp-suffixed) imports without an existing query
	result = result.replace(/(from\s*['"])([^'"]+\.torp)(['"])/g, `$1$2?${override}$3`);

	// Bare package imports (e.g. `@torpor/ui/Progress`)
	result = result.replace(
		/(from\s*['"])([^'".#/][^'"]*)(['"])/g,
		(match: string, pre: string, specifier: string, post: string) => {
			if (specifier.includes("?")) {
				return match;
			}
			if (!isTorporPackageImport(specifier, importerDir)) {
				return match;
			}
			return `${pre}${specifier}?${override}${post}`;
		},
	);

	return result;
}

/**
 * Cache of whether a package (per importing directory) is a torpor package
 */
const torporPackages = new Map<string, boolean>();

/**
 * Whether a bare import specifier (e.g. `@torpor/ui/Progress`) resolves into a
 * package that ships `.torp` files, and so needs override queries passed on
 * to it
 */
function isTorporPackageImport(specifier: string, importerDir: string): boolean {
	// The package name, without any subpath (`pkg` or `@scope/pkg`)
	const pkgName = /^(@[^/]+\/[^/]+|[^@./][^/]*)/.exec(specifier)?.[0];
	if (!pkgName) {
		return false;
	}

	const cacheKey = `${importerDir}\0${pkgName}`;
	let isTorpor = torporPackages.get(cacheKey);
	if (isTorpor === undefined) {
		isTorpor = packageShipsTorp(pkgName, importerDir);
		torporPackages.set(cacheKey, isTorpor);
	}
	return isTorpor;
}

/**
 * Whether a package is a torpor package: it declares a `torpor` entry in its
 * package.json (usually `true`, or a path mirroring the `svelte` field
 * convention), or any of its export targets is a `.torp` file
 */
function packageShipsTorp(pkgName: string, importerDir: string): boolean {
	const packageJsonPath = findPackageJson(pkgName, importerDir);
	if (!packageJsonPath) {
		return false;
	}

	try {
		const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
		if (pkg.torpor === true || typeof pkg.torpor === "string") {
			return true;
		}
		return exportsIncludeTorp(pkg.exports);
	} catch {
		return false;
	}
}

/**
 * Finds a package's package.json, either by resolving it through the
 * package's own exports map, or (when the exports map doesn't expose
 * `./package.json`) through a node_modules walk-up from the importing file
 */
function findPackageJson(pkgName: string, importerDir: string): string | undefined {
	try {
		const require = createRequire(path.join(importerDir, "index.js"));
		const packageJson = require.resolve(`${pkgName}/package.json`);
		if (path.isAbsolute(packageJson)) {
			return packageJson;
		}
	} catch {
		// Fall through to the node_modules walk-up below
	}

	let dir = importerDir;
	while (true) {
		const packageJson = path.join(dir, "node_modules", ...pkgName.split("/"), "package.json");
		if (existsSync(packageJson)) {
			return packageJson;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			return undefined;
		}
		dir = parent;
	}
}

function exportsIncludeTorp(exports: unknown): boolean {
	if (typeof exports === "string") {
		return exports.endsWith(".torp");
	}
	if (Array.isArray(exports)) {
		return exports.some(exportsIncludeTorp);
	}
	if (exports && typeof exports === "object") {
		return Object.values(exports).some(exportsIncludeTorp);
	}
	return false;
}

/*
function printTransformed(transformed: string) {
	console.log(
		transformed
			.split("\n")
			.map((l, i) => `${(i + 1).toString().padEnd(3)} ${l}`)
			.join("\n"),
	);
}
*/

export const unplugin: UnpluginInstance<Options | undefined, boolean> =
	/* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
