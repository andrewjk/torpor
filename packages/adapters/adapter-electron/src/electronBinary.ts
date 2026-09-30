import { createRequire } from "node:module";
import path from "node:path";

/**
 * Resolves the Electron executable to run, preferring the copy installed in
 * the site's node_modules (`require("electron")` resolves to the binary path)
 * and falling back to `electron` on PATH. The package may not be installed --
 * e.g. a CI build that only builds the site -- in which case launching is
 * skipped and callers report how to install it.
 */
export default function electronBinary(siteRoot: string): string {
	try {
		const require = createRequire(path.join(siteRoot, "package.json"));
		const resolved: unknown = require("electron");
		return typeof resolved === "string" ? resolved : "electron";
	} catch {
		return "electron";
	}
}
