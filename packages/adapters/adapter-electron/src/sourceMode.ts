import { realpathSync } from "node:fs";
import path from "node:path";

// Mirrors the entry-path logic in @torpor/build's `utils/entryPaths.ts` (kept
// local so the adapter stays compatible with older @torpor/build installs).

/**
 * Whether the framework is symlinked into the app from outside node_modules
 * (workspace links and `link:` overrides), meaning tb runs it from source via
 * the `development` export conditions. Registry installs always run dist.
 */
export default function detectSourceMode(siteRoot: string): boolean {
	if (process.env.TORPOR_SOURCE_DEV) return true;
	const packages = ["@torpor/build", "@torpor/view"];
	return packages.every((pkg) => {
		try {
			const dist = path.resolve(siteRoot, "node_modules", pkg, "dist/index.mjs");
			const real = realpathSync(dist);
			return !real.includes("node_modules");
		} catch {
			return false;
		}
	});
}
