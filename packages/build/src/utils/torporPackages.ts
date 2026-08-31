import { existsSync, readFileSync } from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import path from "node:path";
import type { UserConfig } from "vite";

type PackageJson = {
	name?: string;
	torpor?: string;
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
 * package.json (e.g. `"torpor": "./lib/index.js"`, mirroring the `svelte`
 * field convention), or when any of its export targets is a `.torp` file.
 *
 * @param siteRoot The root folder of the site
 * @returns The names of the torpor packages found (may be empty)
 */
export default function findTorporPackages(siteRoot: string): string[] {
	const sitePackageJson = path.resolve(siteRoot, "package.json");
	if (!existsSync(sitePackageJson)) return [];

	const pkg: PackageJson = JSON.parse(readFileSync(sitePackageJson, "utf8"));
	const packages = new Set<string>();
	const visited = new Set<string>();

	const rootRequire = createRequire(sitePackageJson);
	for (const name of dependencyNames(pkg)) {
		collectTorporPackage(name, rootRequire, packages, visited);
	}
	return [...packages];
}

/**
 * Adds `optimizeDeps.exclude` and `ssr.noExternal` entries for packages that
 * ship `.torp` files, so that they are served/bundled through the torpor
 * compiler instead.
 */
export function addTorporPackageConfig(siteRoot: string, config: UserConfig): void {
	const packages = findTorporPackages(siteRoot);
	if (packages.length === 0) return;

	config.optimizeDeps ??= {};
	config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), ...packages];

	config.ssr ??= {};
	const noExternal = config.ssr.noExternal;
	if (noExternal === undefined) {
		config.ssr.noExternal = packages;
	} else if (Array.isArray(noExternal)) {
		noExternal.push(...packages);
	}
	// For `true` (bundle everything) or string/regex values there is nothing
	// sensible to merge, and they already bundle more than we need
}

function dependencyNames(pkg: PackageJson): string[] {
	return [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.devDependencies ?? {}),
		...Object.keys(pkg.optionalDependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}),
	];
}

function collectTorporPackage(
	name: string,
	require: NodeRequire,
	packages: Set<string>,
	visited: Set<string>,
): void {
	// Some packages shadow Node builtins (e.g. a dependency literally named
	// "path"), and builtins can't contain .torp files
	if (isBuiltin(name)) return;

	const packageJsonPath = resolvePackageJson(name, require);
	if (!packageJsonPath || visited.has(packageJsonPath)) return;
	visited.add(packageJsonPath);

	let pkg: PackageJson;
	try {
		pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
	} catch {
		return;
	}

	if (isTorporPackage(pkg)) {
		packages.add(pkg.name ?? name);
	}

	// Recurse into the package's own dependencies, resolved relative to it
	// (pnpm keeps transitive deps out of the site's top-level node_modules)
	const depRequire = createRequire(packageJsonPath);
	for (const depName of dependencyNames(pkg)) {
		collectTorporPackage(depName, depRequire, packages, visited);
	}
}

function isTorporPackage(pkg: PackageJson): boolean {
	if (typeof pkg.torpor === "string") return true;
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
			// Not resolvable from here (e.g. an optional peer), skip it
			return undefined;
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
