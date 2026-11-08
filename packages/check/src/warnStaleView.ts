import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Warns when the `@torpor/view` dist that the compiler resolves to is older
 * than its src tree. The check pipeline compiles `.torp` files through
 * `@torpor/view/compile`, which resolves to the packed `dist` — so after
 * changing `packages/view/src` without rebuilding, reported errors describe
 * stale compiler output that no longer matches the current compiler (this has
 * produced batches of phantom errors before). Only fires inside the monorepo,
 * where a `src` sibling exists to compare against; a one-line warning is
 * cheaper than the rebuild it saves.
 */
export default function warnStaleView(): void {
	const require = createRequire(import.meta.url);
	let viewDir: string;
	try {
		viewDir = path.dirname(require.resolve("@torpor/view/package.json"));
	} catch {
		return;
	}
	const srcDir = path.join(viewDir, "src");
	const distDir = path.join(viewDir, "dist");
	if (!existsSync(srcDir) || !existsSync(distDir)) {
		// An installed copy in a user project — nothing to compare
		return;
	}

	const newestMtime = (folder: string): number => {
		let newest = 0;
		const walk = (dir: string): void => {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					walk(full);
				} else {
					const mtime = statSync(full).mtimeMs;
					if (mtime > newest) newest = mtime;
				}
			}
		};
		walk(folder);
		return newest;
	};

	if (newestMtime(srcDir) > newestMtime(distDir)) {
		console.warn(
			"NOTE: @torpor/view/dist is older than its src — check results may not match the current compiler. Run `pnpm build` in packages/view to refresh.",
		);
	}
}
