import { type Site } from "@torpor/build";
import { nodeDev } from "@torpor/build/node-dev";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";
import electronBinary from "./electronBinary";
import detectSourceMode from "./sourceMode";
import type { ElectronOptions } from "./types";

/**
 * Dev support: the framework's default Node dev runtime (which serves SSR off
 * the Vite dev server) plus a launcher that opens an Electron window pointed at
 * it. Without `nodeDev`, providing `Adapter.dev` would replace the Node
 * runtime entirely, which Electron doesn't need -- it runs on Node.
 */
export default function electronDev(site: Site, options: ElectronOptions): Plugin[] {
	return [nodeDev(site, detectSourceMode(site.root)), electronLauncher(site, options)];
}

function electronLauncher(site: Site, options: ElectronOptions): Plugin {
	let child: ChildProcess | undefined;
	let quitting = false;

	const stopChild = (): void => {
		child?.kill();
		child = undefined;
	};

	return {
		name: "torpor-electron-dev",
		configureServer(server: ViteDevServer) {
			if (options.dev === false || process.env.TORPOR_ELECTRON === "0") return;

			const start = (): void => {
				const url = devServerUrl(server);
				if (!url) return;
				stopChild();
				quitting = false;

				const proc = launch(site, url, options);
				child = proc;

				// When the user quits the app (Cmd+Q, or closing the window),
				// stop the dev server too, so `tb --dev` exits with the desktop
				// app. A failed launch emits "error", not "exit", so browser-only
				// dev is unaffected
				proc.once("exit", () => {
					if (quitting) return;
					quitting = true;
					void server.close();
				});
			};

			const httpServer = server.httpServer;
			if (httpServer?.listening) {
				start();
			} else {
				httpServer?.once("listening", start);
			}

			// Vite is shutting down (Ctrl+C, a restart, or close() from the
			// handler above): kill the window without re-closing the server
			httpServer?.once("close", () => {
				quitting = true;
				stopChild();
			});

			process.once("exit", stopChild);
		},
	};
}

function launch(site: Site, url: string, options: ElectronOptions): ChildProcess {
	const adapterFolder = path.dirname(fileURLToPath(import.meta.url));
	const entry = path.join(adapterFolder, "dev-main.mjs");

	const config = {
		partition: options.partition ?? "persist:torpor",
		window: options.window ?? {},
	};

	const child = spawn(electronBinary(site.root), [entry], {
		cwd: site.root,
		stdio: "inherit",
		env: {
			...process.env,
			TORPOR_ELECTRON_URL: url,
			TORPOR_ELECTRON_CONFIG: JSON.stringify(config),
		},
	});

	child.on("error", (error: NodeJS.ErrnoException) => {
		if (error.code === "ENOENT") {
			console.warn(
				"[torpor] Electron is not installed, so dev is running in the browser only. " +
					"Install it with `npm install -D electron` to open a desktop window.",
			);
		} else {
			console.warn(`[torpor] Could not launch Electron: ${error.message}`);
		}
	});

	return child;
}

function devServerUrl(server: ViteDevServer): string | undefined {
	const local = server.resolvedUrls?.local?.[0];
	if (local) return local;

	const address = server.httpServer?.address();
	if (address && typeof address === "object") {
		const protocol = server.config.server.https ? "https" : "http";
		const host =
			address.address === "::" || address.address === "0.0.0.0" ? "localhost" : address.address;
		return `${protocol}://${host}:${address.port}`;
	}

	return undefined;
}
