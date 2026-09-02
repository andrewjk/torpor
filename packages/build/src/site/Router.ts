import type LayoutHandler from "../types/LayoutHandler";
import type ManifestRoute from "../types/ManifestRoute";
import type RouteHandler from "../types/RouteHandler";
import PathTrie from "../utils/pathTrie";

/**
 * A router that handles file routes with layouts, hooks, etc.
 */
export default class Router {
	routes: Route[] = [];
	// Match index for the routes above. The routes list is kept for
	// introspection (layouts/hooks lookup, client nav, tests); the trie is
	// what `match` walks.
	#trie = new PathTrie<Route>();

	constructor() {}

	//add(path: string, file: string) {
	//	// TODO: Call the specific addX method based on the file path
	//	this.addPage(route, file);
	//}

	addPages(routes: ManifestRoute[]): this {
		for (let r of routes) {
			this.addPage(r.path, r.type, r.endPoint, r.subFolder);
		}
		return this;
	}

	// TODO: Allow calling with the endpoint itself, so that you can setup an app with no scaffold
	addPage(path: string, type: number, endPoint: () => Promise<any>, subFolder?: string): this {
		let route = new Route(path, {
			path,
			type,
			endPoint,
			subFolder,
		});
		this.routes.push(route);
		this.#trie.insert(path, route);
		this.#sortRoutes();
		return this;
	}

	/*
	loadPage(ev: ServerEvent, file: string): Response {
		let page = this.pages.get(file);
		if (!page) {
			page = {};
			this.pages.set(file, page);
		}
	}
	*/

	match(path: string, query: URLSearchParams): RouteMatch | undefined {
		let found = this.#trie.match(path);
		if (found) {
			let route = found.value;
			// Lazy load server endpoints and layouts
			if (!route.handler.loaded) {
				this.#loadHandler(route.handler, route.path);
			}

			return {
				handler: route.handler,
				params: found.params,
				query,
			};
		}
	}

	#loadHandler(handler: RouteHandler, path: string) {
		handler.layouts = this.#findLayouts(path, handler);
		handler.serverEndPoint = this.#findServer(path);
		handler.serverHooks = this.#findServerHooks(handler);
	}

	#findLayouts(path: string, handler: RouteHandler): LayoutHandler[] | undefined {
		let layouts: LayoutHandler[] = [];
		let parts = path
			// Strip the trailing`~/server` (so we don't look for `~/server/_layout`
			// which will never exist)
			.replace(/\/~server$/, "")
			// The path will always start with / so splitting e.g. `/first/second`
			// will result in ['', 'first', 'second'] and checks for `/_layout`,
			// `/first/_layout` and `/second/_layout`
			.split("/");
		let basePath = "";
		for (let i = 0; i < parts.length; i++) {
			if (i > 0) {
				basePath += "/" + parts[i];
			}
			const layoutPath = basePath + "/_layout";
			const layoutRoute = this.routes.find((r) => r.path === layoutPath);
			if (layoutRoute && layoutRoute.handler.subFolder === handler.subFolder) {
				layouts.push({
					path: layoutPath,
					endPoint: layoutRoute.handler.endPoint,
					serverEndPoint: this.#findServer(layoutPath),
				});
			}
		}
		return layouts.length ? layouts : undefined;
	}

	#findServer(path: string): (() => Promise<any>) | undefined {
		const serverPath = path.replace(/\/$/, "") + "/~server";
		const serverRoute = this.routes.find((r) => r.path === serverPath);
		return serverRoute && serverRoute.handler.endPoint;
	}

	#findServerHooks(handler: RouteHandler): (() => Promise<any>)[] | undefined {
		// Collect the hooks from the root down to the route path, like
		// layouts. Only hooks with the same subFolder are included, so that
		// e.g. an `api` set of routes can have its own hooks
		const hooks: (() => Promise<any>)[] = [];
		let parts = handler.path
			// Strip the trailing `~server` (so we don't look for
			// `~server/_hook/~server` which will never exist)
			.replace(/\/~server$/, "")
			// The path will always start with / so splitting e.g.
			// `/first/second` will result in ['', 'first', 'second'] and
			// checks for `/_hook/~server`, `/first/_hook/~server` and
			// `/second/_hook/~server`
			.split("/");
		let basePath = "";
		for (let i = 0; i < parts.length; i++) {
			if (i > 0) {
				basePath += "/" + parts[i];
			}
			const hookPath = basePath + "/_hook/~server";
			const hookRoute = this.routes.find((r) => r.path === hookPath);
			if (hookRoute && hookRoute.handler.subFolder === handler.subFolder) {
				hooks.push(hookRoute.handler.endPoint);
			}
		}
		return hooks.length ? hooks : undefined;
	}

	// HACK: We're doing this here as well as in Site, so that you can use the
	// Router externally without Site
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

class Route {
	path: string;
	handler: RouteHandler;

	constructor(path: string, handler: RouteHandler) {
		this.path = path;
		this.handler = handler;
	}
}

interface RouteMatch {
	handler: RouteHandler;
	params?: Record<string, string>;
	query: URLSearchParams;
}
