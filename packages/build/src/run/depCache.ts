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
 * Clears site/node_modules/.vite when workspace packages changed since the
 * last dev run. Returns true when the cache was removed.
 */
export function clearStaleDepCache(siteRoot: string, log?: (message: string) => void): boolean {
	try {
		const workspaceRoot = findWorkspaceRoot(siteRoot);
		if (!workspaceRoot) return false;

		const cacheDir = path.join(siteRoot, "node_modules", ".vite");
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

function findWorkspaceRoot(from: string): string | undefined {
	let dir = path.resolve(from);
	while (true) {
		if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
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
 * Hashes every file of every site dependency that resolves inside the
 * workspace. Returns undefined when there is nothing to fingerprint (no
 * workspace packages -- the common case outside the monorepo).
 */
function fingerprintWorkspacePackages(siteRoot: string, workspaceRoot: string): string | undefined {
	const sitePackageJson = path.join(siteRoot, "package.json");
	if (!existsSync(sitePackageJson)) return undefined;

	const pkg: PackageJson = JSON.parse(readFileSync(sitePackageJson, "utf8"));
	const require = createRequire(sitePackageJson);

	const packageDirs = new Set<string>();
	for (const name of dependencyNames(pkg)) {
		const dir = resolvePackageDir(name, require);
		if (dir && insideWorkspace(realpathSync(dir), workspaceRoot)) {
			packageDirs.add(realpathSync(dir));
		}
	}
	if (packageDirs.size === 0) return undefined;

	const hash = createHash("sha1");
	for (let dir of [...packageDirs].sort()) {
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
