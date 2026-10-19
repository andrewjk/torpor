import { createHash } from "node:crypto";
import {
	existsSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { PackageJson } from "../utils/torporPackages";

/**
 * Vite's dep-optimization cache (node_modules/.vite) keys off the lockfile
 * and config, but not the content of workspace packages. When a workspace
 * package is rebuilt while the cache holds prebundled copies of it, dev SSR
 * keeps executing the stale modules -- producing bizarre errors (missing
 * runtime identifiers, "$cache must be used in a getter", ...) that only a
 * manual cache delete fixes.
 *
 * clearStaleDepCache runs at `tb --dev` startup: it fingerprints every
 * workspace package the site depends on (path, size and mtime of each file)
 * and, when the fingerprint differs from the previous run, deletes the cache
 * so Vite re-optimizes from the rebuilt packages.
 *
 * Live rebuilds while the server is up are still not hot-invalidated (that
 * needs a watcher feeding Vite's module graph); this closes the "restart and
 * hope you remember the trick" gap.
 */

const STORE_NAME = ".torpor-dev-cache.json";

/**
 * The dep cache a dev server should use: Vite's default
 * (`<siteRoot>/node_modules/.vite`) would be shared by every app whose
 * `site.root` is the same -- e.g. a workspace package that owns the views and
 * is used by both a web and an Electron app. Those apps have different configs
 * (aliases, plugins, adapter), so they optimize different dep graphs; sharing
 * one directory makes each rewrite the other's `_metadata.json` (browser
 * hashes go stale, Vite answers 504) and lets one app's startup clear the
 * other's running cache. Derive a directory from the config file instead.
 */
export function defaultDepCacheDir(siteRoot: string, configFile?: string): string {
	const base = path.join(siteRoot, "node_modules", ".vite");
	if (!configFile) return base;
	const absolute = path.resolve(configFile);
	const name = path
		.basename(absolute)
		.replace(/\.[^.]+$/, "")
		.replace(/[^\w.-]+/g, "-");
	const hash = createHash("sha1").update(absolute).digest("hex").slice(0, 8);
	return path.join(base, `${name}-${hash}`);
}

/**
 * Clears the dev dep cache when workspace packages changed since the last dev
 * run. Returns true when the cache was removed.
 *
 * @param cacheDir The Vite cache directory (see `defaultDepCacheDir`). Defaults
 *   to `<siteRoot>/node_modules/.vite`.
 */
export function clearStaleDepCache(
	siteRoot: string,
	cacheDir: string = path.join(siteRoot, "node_modules", ".vite"),
	log?: (message: string) => void,
): boolean {
	try {
		const workspaceRoot = findWorkspaceRoot(siteRoot);
		if (!workspaceRoot) return false;

		const storePath = path.join(siteRoot, "node_modules", STORE_NAME);

		const fingerprint = fingerprintWorkspacePackages(siteRoot, workspaceRoot);
		if (fingerprint === undefined) return false;

		const previous = readStore(storePath);

		let cleared = false;
		if (existsSync(cacheDir) && previous !== fingerprint) {
			rmSync(cacheDir, { recursive: true, force: true });
			cleared = true;
			log?.("Workspace packages changed; clearing the Vite dep cache");
		}
		writeFileSync(storePath, JSON.stringify({ fingerprint }));

		return cleared;
	} catch (e) {
		if (process.env.TORPOR_DEBUG_CACHE) throw e;
		// Never break dev startup over cache bookkeeping
		return false;
	}
}

export function findWorkspaceRoot(from: string): string | undefined {
	let dir = path.resolve(from);
	while (true) {
		// pnpm-style marker, or a root package.json declaring npm workspaces
		if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
			return dir;
		}
		if (hasWorkspacesField(dir)) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

function hasWorkspacesField(dir: string): boolean {
	const packageJsonPath = path.join(dir, "package.json");
	if (!existsSync(packageJsonPath)) return false;
	try {
		const pkg: PackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
		return Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0;
	} catch {
		return false;
	}
}

function readStore(storePath: string): string | undefined {
	if (!existsSync(storePath)) return undefined;
	try {
		const store = JSON.parse(readFileSync(storePath, "utf8")) as { fingerprint?: string };
		return store.fingerprint;
	} catch {
		return undefined;
	}
}

/**
 * Resolves every site dependency that lives inside the workspace to its
 * package folder. Shared with the other dev-startup checks (e.g. the stale
 * .torp copy report), which need the same set of packages.
 */
export function workspaceDependencyDirs(siteRoot: string, workspaceRoot: string): string[] {
	const sitePackageJson = path.join(siteRoot, "package.json");
	if (!existsSync(sitePackageJson)) return [];

	const pkg: PackageJson = JSON.parse(readFileSync(sitePackageJson, "utf8"));
	const require = createRequire(sitePackageJson);

	const packageDirs = new Set<string>();
	for (const name of dependencyNames(pkg)) {
		const dir = resolvePackageDir(name, require);
		if (dir && insideWorkspace(realpathSync(dir), workspaceRoot)) {
			packageDirs.add(realpathSync(dir));
		}
	}
	return [...packageDirs].sort();
}

function fingerprintWorkspacePackages(siteRoot: string, workspaceRoot: string): string | undefined {
	const sitePackageJson = path.join(siteRoot, "package.json");
	if (!existsSync(sitePackageJson)) return undefined;

	const packageDirs = workspaceDependencyDirs(siteRoot, workspaceRoot);
	if (packageDirs.length === 0) return undefined;

	const hash = createHash("sha1");
	for (let dir of packageDirs) {
		hash.update(`package:${dir}\n`);
		fingerprintDir(dir, dir, hash);
	}
	return hash.digest("hex");
}

function dependencyNames(pkg: PackageJson): string[] {
	return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
}

function resolvePackageDir(name: string, require: NodeRequire): string | undefined {
	try {
		const packageJsonPath = require.resolve(`${name}/package.json`);
		return path.dirname(packageJsonPath);
	} catch {
		return undefined;
	}
}

function insideWorkspace(dir: string, workspaceRoot: string): boolean {
	const relative = path.relative(workspaceRoot, dir);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function fingerprintDir(dir: string, root: string, hash: import("node:crypto").Hash): void {
	for (let entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === ".git") continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			fingerprintDir(full, root, hash);
			continue;
		}
		if (!entry.isFile()) continue;
		const stats = statSync(full);
		// NOTE: hash.update takes (data, encoding) -- join into one string
		hash.update(
			`file:${path.relative(root, full).replaceAll("\\", "/")}:${stats.size}:${Math.floor(stats.mtimeMs)}\n`,
		);
	}
}
