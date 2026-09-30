import { type Adapter, type Site } from "@torpor/build";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import electronBinary from "./electronBinary";
import electronDev from "./electronDev";
import postbuild from "./postbuild";
import type { ElectronOptions } from "./types";

/**
 * A @torpor/build adapter for desktop apps.
 *
 * Builds emit an Electron app into `dist/electron` (a main process that serves
 * the site over a loopback HTTP server, a context-isolated preload, and a
 * manifest); preview launches it, and dev opens a window against the Vite dev
 * server. Requests run in the Electron main process on Node, so cookies,
 * sessions and redirects behave exactly as on a normal Node server.
 *
 * ```ts
 * import { electron } from "@torpor/adapter-electron";
 *
 * site.adapter = electron();
 * ```
 */
export default function electron(options: ElectronOptions = {}): Adapter {
	return {
		dev: (site: Site) => electronDev(site, options),
		postbuild: (site: Site) => postbuild(site, options),
		serve: (_server, site: Site) => serve(site),
	};
}

function serve(site: Site): void {
	const appFolder = path.join(site.root, "dist", "electron");
	if (!existsSync(path.join(appFolder, "main.mjs"))) {
		throw new Error(
			"Electron output not found. Run a build first (dist/electron/main.mjs is missing).",
		);
	}

	const child = spawn(electronBinary(site.root), [appFolder], {
		cwd: site.root,
		stdio: "inherit",
	});

	child.on("error", (error: NodeJS.ErrnoException) => {
		if (error.code === "ENOENT") {
			console.error(
				"[torpor] Electron is not installed. Install it with `npm install -D electron`.",
			);
			process.exit(1);
		}
		throw error;
	});

	child.on("exit", (code) => process.exit(code ?? 0));
}
