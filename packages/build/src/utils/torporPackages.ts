import { existsSync, readFileSync } from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import path from "node:path";
import type { UserConfig } from "vite";

export type PackageJson = {
	name?: string;
	torpor?: string | boolean;
	exports?: unknown;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
};

/**
 * Finds packages installed in the site that ship `.torp` files, e.g. icon
 * libraries like phosphor-torpor. These packages need the torpor compiler, so
 * they can't go through Vite's default pipelines: dep optimization parses
 * their files as plain JavaScript (and fails on torpor syntax like `@render`
 * or `import type` from an uncompiled source), and SSR externalization would
 * leave raw `.torp` imports that neither Node nor workerd can load.
 *
 * A package is a torpor package when it declares a `torpor` entry in its
 * package.json, or when any of its export targets is a `.torp` file. The
 * entry is usually a path (`"torpor": "./lib/index.js"`, mirroring the
 * `svelte` field convention), but packages that ship compiled output can
 * just mark themselves with `"torpor": true`.
 *
 * @param siteRoot The root folder of the site
 * @returns The names of the torpor packages found (may be empty)
 */
export default function findTorporPackages(siteRoot: string): string[] {
	const { torporPackages } = collectPackages(siteRoot);
	return [...torporPackages];
}

/**
 * Walks the site's dependency tree, collecting:
 *
 * - `torporPackages`: packages that ship `.torp` files and so need the torpor
 *   compiler (they can't be externalized or prebundled as JavaScript)
 * - `plainDeps`: plain (non-torpor) direct dependencies of those packages.
 *   Once a torpor package is bundled into the SSR build, its bare imports of
 *   plain dependencies stay in the emitted bundle as external imports -- and
 *   under pnpm's strict node_modules layout the app can't resolve them at
 *   runtime (they're only linked inside the torpor package's own
 *   node_modules), so they must be bundled too. Dependencies *of* a bundled
 *   plain package don't need this: they resolve (and inline) at build time
 *   from the package's own location.
 */
function collectPackages(siteRoot: string): {
	torporPackages: Set<string>;
	plainDeps: Set<string>;
} {
	const torporPackages = new Set<string>();
	const plainDeps = new Set<string>();

	const sitePackageJson = path.resolve(siteRoot, "package.json");
	if (!existsSync(sitePackageJson)) return { torporPackages, plainDeps };

	const pkg: PackageJson = JSON.parse(readFileSync(sitePackageJson, "utf8"));
	const visited = new Set<string>();

	const rootRequire = createRequire(sitePackageJson);
	for (const name of dependencyNames(pkg)) {
		collectPackage(name, rootRequire, torporPackages, plainDeps, visited, false);
	}
	return { torporPackages, plainDeps };
}

/**
 * Adds `optimizeDeps.exclude` and `ssr.noExternal` entries for packages that
 * ship `.torp` files, so that they are served/bundled through the torpor
 * compiler instead.
 *
 * The exclusions are mirrored into the SSR optimizer too: Vite's SSR
 * environment optimizer has its own `optimizeDeps` settings, and without the
 * mirror it still prebundles the package and parses its raw `.torp` files as
 * JavaScript. That only shows up on a cold dep cache (a warm cache from before
 * the package was installed masks it), so the root-level exclusion is not
 * enough.
 */
export function addTorporPackageConfig(siteRoot: string, config: UserConfig): void {
	const { torporPackages, plainDeps } = collectPackages(siteRoot);
	if (torporPackages.size === 0) return;

	config.optimizeDeps ??= {};
	config.optimizeDeps.exclude = mergeUnique(config.optimizeDeps.exclude, [...torporPackages]);

	config.ssr ??= {};
	const noExternal = config.ssr.noExternal;
	// Plain dependencies of torpor packages go through the normal pipelines in
	// the browser/optimizer; they only must not be left external in the SSR
	// build (see collectPackages)
	const bundlePackages = [...torporPackages, ...plainDeps];
	if (noExternal === undefined) {
		config.ssr.noExternal = bundlePackages;
	} else if (Array.isArray(noExternal)) {
		noExternal.push(...bundlePackages);
	}
	// For `true` (bundle everything) or string/regex values there is nothing
	// sensible to merge, and they already bundle more than we need

	// The SSR dep optimizer has its own config (the legacy `ssr.optimizeDeps`
	// form and the environment-scoped form used by Vite's environment API).
	// Mirror the exclusions into both so a cold start doesn't parse `.torp`
	// files as JS.
	config.ssr.optimizeDeps ??= {};
	config.ssr.optimizeDeps.exclude = mergeUnique(config.ssr.optimizeDeps.exclude, [
		...torporPackages,
	]);

	config.environments ??= {};
	config.environments.ssr ??= {};
	config.environments.ssr.optimizeDeps ??= {};
	config.environments.ssr.optimizeDeps.exclude = mergeUnique(
		config.environments.ssr.optimizeDeps.exclude,
		[...torporPackages],
	);
}

/** Appends values to an exclusion list without introducing duplicates. */
function mergeUnique(existing: string[] | undefined, values: string[]): string[] {
	return [...new Set([...(existing ?? []), ...values])];
}

function dependencyNames(pkg: PackageJson): string[] {
	return [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.devDependencies ?? {}),
		...Object.keys(pkg.optionalDependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}),
	];
}

function collectPackage(
	name: string,
	require: NodeRequire,
	torporPackages: Set<string>,
	plainDeps: Set<string>,
	visited: Set<string>,
	belowTorpor: boolean,
): void {
	// Some packages shadow Node builtins (e.g. a dependency literally named
	// "path"), and builtins can't contain .torp files
	if (isBuiltin(name)) return;

	const packageJsonPath = resolvePackageJson(name, require);
	if (!packageJsonPath) return;
	// A package can be reached both through a plain path (where nothing needs
	// bundling) and through a torpor package (where it does), so the visited
	// key includes the path's bundling state
	const visitKey = `${packageJsonPath}\n${belowTorpor}`;
	if (visited.has(visitKey)) return;
	visited.add(visitKey);

	let pkg: PackageJson;
	try {
		pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
	} catch {
		return;
	}

	const isTorpor = isTorporPackage(pkg);
	if (isTorpor) {
		torporPackages.add(pkg.name ?? name);
	} else if (belowTorpor) {
		// A plain dependency of a package that gets bundled into the SSR build
		plainDeps.add(pkg.name ?? name);
	}

	// Recurse into the package's own dependencies, resolved relative to it
	// (pnpm keeps transitive deps out of the site's top-level node_modules).
	// Only the direct dependencies of a bundled (torpor) package are forced
	// into the SSR bundle; below a bundled plain package everything resolves
	// at build time
	const depRequire = createRequire(packageJsonPath);
	for (const depName of dependencyNames(pkg)) {
		collectPackage(depName, depRequire, torporPackages, plainDeps, visited, isTorpor);
	}
}

function isTorporPackage(pkg: PackageJson): boolean {
	if (pkg.torpor === true || typeof pkg.torpor === "string") return true;
	return exportsIncludeTorp(pkg.exports);
}

function exportsIncludeTorp(exports: unknown): boolean {
	if (typeof exports === "string") return exports.endsWith(".torp");
	if (Array.isArray(exports)) return exports.some(exportsIncludeTorp);
	if (exports && typeof exports === "object") {
		return Object.values(exports).some(exportsIncludeTorp);
	}
	return false;
}

function resolvePackageJson(name: string, require: NodeRequire): string | undefined {
	// require.resolve returns the name itself for Node builtins, so guard
	// everything below with absolute path checks
	try {
		const packageJson = require.resolve(`${name}/package.json`);
		return path.isAbsolute(packageJson) ? packageJson : undefined;
	} catch {
		let entry: string;
		try {
			entry = require.resolve(name);
		} catch {
			// Not resolvable through Node's resolver -- either the package
			// isn't installed (e.g. an optional peer), or its `exports` map
			// has no `.` or `./package.json` entry and both lookups above
			// threw ERR_PACKAGE_PATH_NOT_EXPORTED. Try the standard
			// node_modules lookup paths directly
			return resolveFromNodeModules(name, require);
		}
		if (!path.isAbsolute(entry)) return undefined;
		let dir = path.dirname(entry);
		while (true) {
			const packageJson = path.join(dir, "package.json");
			if (existsSync(packageJson)) return packageJson;
			const parent = path.dirname(dir);
			if (parent === dir) return undefined;
			dir = parent;
		}
	}
}

/**
 * Finds a package's package.json by checking the standard node_modules
 * lookup paths directly, for packages that Node's resolver can't load
 * (`ERR_PACKAGE_PATH_NOT_EXPORTED`).
 */
function resolveFromNodeModules(name: string, require: NodeRequire): string | undefined {
	for (const dir of require.resolve.paths(name) ?? []) {
		if (!path.isAbsolute(dir)) continue;
		const packageJson = path.join(dir, ...name.split("/"), "package.json");
		if (existsSync(packageJson)) return packageJson;
	}
	return undefined;
}
