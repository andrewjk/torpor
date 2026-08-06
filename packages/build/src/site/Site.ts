import { promises as fs } from "node:fs";
import fpath from "node:path";
import { type Plugin, type UserConfig } from "vite";
import type Adapter from "../types/Adapter";
import type { InlineEndPoint } from "../types/Route";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import type Route from "../types/Route";
import type ServerEndPoint from "../types/ServerEndPoint";
import type ServerHook from "../types/ServerHook";
import {
	ERROR_ROUTE,
	HOOK_ROUTE,
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	RouteType,
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
	routes: Route[] = [];
	// Is default plugins a bad idea?
	plugins: Plugin[] = [];
	// Is default adapter a bad idea?
	adapter: Adapter = defaultAdapter;
	/**
	 * Extra inputs, as absolute file paths, that will be compiled with the
	 * output. What you do with them after that is up to you. File paths ending
	 * with server.ts/js will only be compiled with the server output
	 */
	inputs: string[] = [];
	/**
	 * Vite config options to merge with the standard Torpor build options.
	 * `plugins` and `build.rollupOptions.input` will be overridden, so you
	 * should set `Site.plugins` and `Site.inputs` instead. Other options may be
	 * overridden or incompatible, so experimentation may be required
	 */
	viteConfig?: UserConfig;
	/**
	 * The path to the site.config file. Set automatically by the CLI; used by
	 * the manifest plugin to import inline endpoints for server builds.
	 */
	configFile?: string;
	/**
	 * Inline endpoints keyed by `"path:type"`. Populated by `addRoute` when
	 * the user passes an inline endpoint object instead of a file path.
	 */
	inlineEndPoints: Record<string, InlineEndPoint> = {};

	constructor() {
		this.root = process.cwd();
	}

	/**
	 * Adds a folder of routes, based on the names of the files in the folder
	 * @param folder The folder containing the routes
	 * @param subFolder If a subFolder is set, all routes in the folder will be
	 * placed under the subFolder, and only hooks, layouts etc will be used if
	 * they have the same subFolder. This can be used to create e.g. an `api`
	 * set of routes with their own hook for authorization from various clients
	 */
	async addRouteFolder(folder: string, subFolder?: string): Promise<void> {
		const routeFolder = fpath.join(this.root, folder);
		const routeFiles = await fs.readdir(routeFolder, { recursive: true });
		if (subFolder !== undefined && !subFolder.startsWith("/")) {
			subFolder = "/" + subFolder;
		}
		for (let file of routeFiles) {
			// The file must start with `+` or `_` and end with `.js` or `.ts`
			if (/^(\+|_).+(\.js|\.ts)$/.test(fpath.basename(file))) {
				let routePath = this.#routePath(file);
				if (subFolder !== undefined) {
					routePath = subFolder + routePath;
				}
				let type = this.#routeType(file);
				file = fpath.relative(this.root, fpath.resolve(routeFolder, file));
				this.routes.push({
					path: routePath,
					file,
					type,
					subFolder: subFolder,
				});
			}
		}
		this.#sortRoutes();
	}

	/**
	 * Adds a file route, which can have a standard name (e.g. +page.ts) or any
	 * name if you pass the type
	 * @param path The route path
	 * @param file The file
	 * @param type The file type (if the file name is non-standard)
	 */
	addRouteFile(
		path: string,
		file: string,
		type?:
			| "+page"
			| "+page.server"
			| "+server"
			| "_layout"
			| "_layout.server"
			| "_hook"
			| "_hook.server"
			| "_error",
		subFolder?: string,
	): void {
		let routePath = this.#routePath(fpath.join(path, type ?? fpath.basename(file)));
		let routeType = type ? this.#routeTypeFromString(type) : this.#routeType(file);
		if (subFolder !== undefined && !subFolder.startsWith("/")) {
			subFolder = "/" + subFolder;
		}
		this.routes.push({
			path: routePath,
			file,
			type: routeType,
			subFolder: subFolder,
		});
		this.#sortRoutes();
	}

	#routePath(file: string): string {
		let routePath = file
			.replace(/^\//, "")
			.replace(/(\.ts|\.js)$/, "")
			.replace(/_hook.server$/, "_hook/~server")
			.replace(/_layout.server$/, "_layout/~server")
			.replace(/\+page.server$/, "~server")
			.replace(/\+server$/, "")
			.replace(/\+page$/, "")
			.replace(/\/$/, "");
		return routePath.length > 0 ? `/${routePath}` : "/";
	}

	#routeType(file: string): RouteType {
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
		} else if (routePath.endsWith("_error")) {
			return ERROR_ROUTE;
		}
		return -1;
	}

	#routeTypeFromString(
		type:
			| "+page"
			| "+page.server"
			| "+server"
			| "_layout"
			| "_layout.server"
			| "_hook"
			| "_hook.server"
			| "_error",
	) {
		switch (type) {
			case "+page":
				return PAGE_ROUTE;
			case "+page.server":
				return PAGE_SERVER_ROUTE;
			case "+server":
				return SERVER_ROUTE;
			case "_layout":
				return LAYOUT_ROUTE;
			case "_layout.server":
				return LAYOUT_SERVER_ROUTE;
			case "_hook":
				return HOOK_ROUTE;
			case "_hook.server":
				return HOOK_SERVER_ROUTE;
			case "_error":
				return ERROR_ROUTE;
		}
	}

	/**
	 * Adds a route in code, without needing the standard file naming
	 * conventions (+page.ts, +page.server.ts, etc). This is useful for small
	 * sites with one or two pages.
	 *
	 * Any combination of options may be provided; each maps to the
	 * corresponding file-route type:
	 *
	 * - `page` — a `+page` (`.torp` component or `.ts`/`.js` `PageEndPoint`)
	 * - `pageServer` — a `+page.server` (`PageServerEndPoint`, file or inline)
	 * - `server` — a `+server` HTTP endpoint (`ServerEndPoint`, file or inline)
	 * - `layout` — a `_layout` (`.torp` component or `.ts`/`.js` `PageEndPoint`)
	 * - `layoutServer` — a `_layout.server` (`PageServerEndPoint`, file or inline)
	 * - `hookServer` — a `_hook.server` (`ServerHook`, file or inline)
	 * - `error` — an `_error` page (`.torp` component or `.ts`/`.js` `PageEndPoint`)
	 *
	 * Options that need a component (`page`, `layout`, `error`) must be file
	 * paths so the component is included in the client bundle. Server-only
	 * options (`pageServer`, `server`, `layoutServer`, `hookServer`) accept
	 * either a file path or an inline object; inline server code is kept out
	 * of the client bundle automatically.
	 *
	 * @example
	 * // A page with an inline server action
	 * site.addRoute("/", {
	 *   page: "./src/Counter.torp",
	 *   pageServer: { actions: { set: async ({ request }) => ok() } },
	 * });
	 * @example
	 * // A JSON API endpoint
	 * site.addRoute("/api/time", {
	 *   server: { get: async () => ok({ time: Date.now() }) },
	 * });
	 * @example
	 * // A root layout, server hook, and error page
	 * site.addRoute("/", {
	 *   layout: "./src/Layout.torp",
	 *   hookServer: { handle: async (event) => {} },
	 *   error: "./src/ErrorPage.torp",
	 * });
	 *
	 * @param path The route path, e.g. `/` or `/about`
	 * @param options File paths and/or inline endpoints for the route
	 * @param subFolder An optional subFolder for grouping routes
	 */
	addRoute(
		path: string,
		options: {
			page?: string;
			pageServer?: string | PageServerEndPoint;
			server?: string | ServerEndPoint;
			layout?: string;
			layoutServer?: string | PageServerEndPoint;
			hookServer?: string | ServerHook;
			error?: string;
		},
		subFolder?: string,
	): void {
		let normalizedSubFolder = subFolder;
		if (normalizedSubFolder !== undefined && !normalizedSubFolder.startsWith("/")) {
			normalizedSubFolder = "/" + normalizedSubFolder;
		}

		// The base path with any trailing slash stripped, so that we can
		// append "/_layout", "/~server" etc. For the root "/" this is "".
		let base = path.replace(/\/$/, "");

		if (options.page !== undefined) {
			this.#pushRoute(path, PAGE_ROUTE, options.page, normalizedSubFolder);
		}
		if (options.pageServer !== undefined) {
			this.#pushRoute(
				`${base}/~server`,
				PAGE_SERVER_ROUTE,
				options.pageServer,
				normalizedSubFolder,
			);
		}
		if (options.server !== undefined) {
			this.#pushRoute(path, SERVER_ROUTE, options.server, normalizedSubFolder);
		}
		if (options.layout !== undefined) {
			this.#pushRoute(`${base}/_layout`, LAYOUT_ROUTE, options.layout, normalizedSubFolder);
		}
		if (options.layoutServer !== undefined) {
			this.#pushRoute(
				`${base}/_layout/~server`,
				LAYOUT_SERVER_ROUTE,
				options.layoutServer,
				normalizedSubFolder,
			);
		}
		if (options.hookServer !== undefined) {
			this.#pushRoute(
				`${base}/_hook/~server`,
				HOOK_SERVER_ROUTE,
				options.hookServer,
				normalizedSubFolder,
			);
		}
		if (options.error !== undefined) {
			this.#pushRoute(`${base}/_error`, ERROR_ROUTE, options.error, normalizedSubFolder);
		}

		this.#sortRoutes();
	}

	/**
	 * Pushes a single route entry, handling both file-path and inline-endpoint
	 * targets. File paths are resolved relative to the site root; inline
	 * endpoints are also stored in `inlineEndPoints` keyed by `"path:type"`
	 * so the manifest plugin can resolve them at build time.
	 */
	#pushRoute(
		routePath: string,
		type: RouteType,
		target: string | InlineEndPoint,
		subFolder?: string,
	): void {
		if (typeof target === "string") {
			let file = fpath.relative(this.root, fpath.resolve(this.root, target));
			this.routes.push({ path: routePath, file, type, subFolder });
		} else {
			let key = `${routePath}:${type}`;
			this.inlineEndPoints[key] = target;
			this.routes.push({ path: routePath, endPoint: target, type, subFolder });
		}
	}

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
