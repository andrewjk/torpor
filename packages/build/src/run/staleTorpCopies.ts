import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { PackageJson } from "../utils/torporPackages";
import { findWorkspaceRoot, workspaceDependencyDirs } from "./depCache";

/**
 * Workspace packages that ship copies of their .torp components (e.g.
 * @torpor/ui copies its src .torp files into dist/ during its build) can go
 * stale: a site resolves the package to its dist folder, so edits to src
 * silently keep serving the OLD components until the package is rebuilt.
 * The symptom is confusing -- e.g. a TypeError about a renamed slot prop
 * after a component's API changed.
 *
 * reportStaleTorpCopies runs at `tb --dev` startup: for every workspace
 * dependency with both src and dist folders, it compares the .torp files and
 * reports anything missing from dist, differing from src, or left over in
 * dist without a src file.
 */

/**
 * Reports stale dist .torp copies in the site's workspace dependencies.
 * Never throws -- a broken check must not break dev startup.
 */
export function reportStaleTorpCopies(siteRoot: string, log?: (message: string) => void): void {
	try {
		const workspaceRoot = findWorkspaceRoot(siteRoot);
		if (!workspaceRoot) return;

		for (const dir of workspaceDependencyDirs(siteRoot, workspaceRoot)) {
			const srcFolder = path.join(dir, "src");
			const distFolder = path.join(dir, "dist");
			// Only packages that ship dist copies of src .torp files are
			// checked; packages without the folders (or with neither .torp
			// set) are skipped
			if (!existsSync(srcFolder) || !existsSync(distFolder)) continue;
			const src = collectTorpFiles(srcFolder);
			const dist = collectTorpFiles(distFolder);
			if (src.size === 0 && dist.size === 0) continue;

			const problems: string[] = [];
			for (const [rel, content] of src) {
				const distContent = dist.get(rel);
				if (distContent === undefined) {
					problems.push(`${rel} (not copied to dist)`);
				} else if (distContent !== content) {
					problems.push(`${rel} (differs from src)`);
				}
			}
			for (const rel of dist.keys()) {
				if (!src.has(rel)) {
					problems.push(`${rel} (left over in dist, no src file)`);
				}
			}
			if (problems.length === 0) continue;

			const shown = problems
				.slice(0, 5)
				.map((p) => `  ${p}`)
				.join("\n");
			const more = problems.length > 5 ? `\n  ... and ${problems.length - 5} more` : "";
			log?.(
				`${packageLabel(dir, workspaceRoot)}'s dist .torp copies are stale, so the site is ` +
					`serving OLD components:\n${shown}${more}\n` +
					`Rebuild the package (e.g. \`pnpm build\` in ` +
					`${path.relative(workspaceRoot, dir) || "."}) and restart \`tb --dev\`.`,
			);
		}
	} catch (e) {
		if (process.env.TORPOR_DEBUG_CACHE) throw e;
	}
}

function collectTorpFiles(folder: string): Map<string, string> {
	const files = new Map<string, string>();
	collect(folder, folder, files);
	return files;
}

function collect(folder: string, root: string, files: Map<string, string>): void {
	for (const entry of readdirSync(folder, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === ".git") continue;
		const full = path.join(folder, entry.name);
		if (entry.isDirectory()) {
			collect(full, root, files);
			continue;
		}
		if (!entry.isFile() || !entry.name.endsWith(".torp")) continue;
		files.set(path.relative(root, full).replaceAll("\\", "/"), readFileSync(full, "utf8"));
	}
}

function packageLabel(dir: string, workspaceRoot: string): string {
	try {
		const pkg: PackageJson = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
		if (pkg.name) return pkg.name;
	} catch {
		// Fall through to the relative path
	}
	return path.relative(workspaceRoot, dir) || dir;
}
