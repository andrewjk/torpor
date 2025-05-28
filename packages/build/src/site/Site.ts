import { promises as fs } from "node:fs";
import path from "node:path";
import { type Plugin, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type Adapter from "../types/Adapter";
import {
	HOOK_ROUTE,
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../types/RouteType";
import defaultAdapter from "./defaultAdapter";

// 1. The user sets this up
// 2. It is passed into serverEntry and clientEntry through a Vite plugin
//    (defined in manifest.ts)
// 3. In those files, it is used to build a Router

/**
 * The Site class contains the information necessary to setup a @torpor/build
 * site, including routes, plugins, and options.
 */
export default class Site {
	root: string;
	routes: { path: string; file: string; type: number }[] = [];
	// Is default plugins a bad idea?
	// HACK: Set loose because otherwise it uses a list of allowed extensions
	// TODO: Should probably just do this ourselves and let the user pass in
	// tsconfigPaths themselves if they want to do something funky
	plugins: Plugin[] = [tsconfigPaths({ loose: true })];
	// Is default adapter a bad idea?
	adapter: Adapter = defaultAdapter;
	/**
	 * Extra inputs, as absolute file paths, that will be compiled with the
	 * output. What you do with them after that is up to you. File paths ending
	 * with server.ts/js will only be compiled with the server output
	 */
	inputs: string[] = [];
	/**
	 * Vite config options. `plugins` and `build` will be overridden.
	 */
	viteConfig?: UserConfig;

	constructor() {
		this.root = process.cwd();
	}

	async addRouteFolder(folder: string): Promise<void> {
		const routeFolder = path.join(this.root, folder);
		const routeFiles = await fs.readdir(routeFolder, { recursive: true });

		for (let file of routeFiles) {
			// The file must start with `+` or `_` and end with `.js` or `.ts`
			if (/^(\+|_).+(\.js|\.ts)$/.test(path.basename(file))) {
				let routePath = file
					.replace(/^\//, "")
					.replace(/(\.ts|\.js)$/, "")
					.replace(/_hook.server$/, "_hook/~server")
					.replace(/_layout.server$/, "_layout/~server")
					.replace(/\+page.server$/, "~server")
					.replace(/\+server$/, "")
					.replace(/\+page$/, "")
					.replace(/\/$/, "");
				routePath = routePath.length > 0 ? `/${routePath}` : "/";
				let type = this.#routeType(file);
				file = path.relative(this.root, path.resolve(routeFolder, file));
				this.routes.push({ path: routePath, file, type });
			}
		}
		this.#sortRoutes();
	}

	addRouteFile(path: string, file: string): void {
		let type = this.#routeType(file);
		this.routes.push({ path, file, type });
		this.#sortRoutes();
	}

	#routeType(file: string): number {
		let routePath = file.replace(/^\//, "").replace(/(\.ts|\.js)$/, "");
		if (routePath.endsWith("+page")) {
			return PAGE_ROUTE;
		} else if (routePath.endsWith("+page.server")) {
			return PAGE_SERVER_ROUTE;
		} else if (routePath.endsWith("+server")) {
			return SERVER_ROUTE;
		} else if (routePath.endsWith("_layout")) {
			return LAYOUT_ROUTE;
		} else if (routePath.endsWith("_layout.server")) {
			return LAYOUT_SERVER_ROUTE;
		} else if (routePath.endsWith("_hook")) {
			return HOOK_ROUTE;
		} else if (routePath.endsWith("_hook.server")) {
			return HOOK_SERVER_ROUTE;
		}
		return -1;
	}

	// TODO: You could make your site in a single file, like e.g. Hono...
	//addPage(path: string, endPoint: PageEndPoint, serverEndPoint?: PageServerEndPoint) {}
	//addEndPoint(path: string, endPoint: ServerEndPoint) {}

	#sortRoutes() {
		this.routes = this.routes.sort((a, b) => {
			// Sort [param]s after paths
			// There might be a quicker/easier way to do this
			for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
				if (a.path[i] === "[" && b.path[i] !== "[") {
					return 1;
				} else if (b.path[i] === "[" && a.path[i] !== "[") {
					return -1;
				} else if (a.path[i] === b.path[i]) {
					// Keep going...
				} else {
					return a.path[i].localeCompare(b.path[i]);
				}
			}
			return a.path.length - b.path.length;
		});
	}
}
