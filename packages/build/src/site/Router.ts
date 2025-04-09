import type LayoutHandler from "../types/LayoutHandler";
import type ManifestRoute from "../types/ManifestRoute";
import type RouteHandler from "../types/RouteHandler";
import pathToRegex from "./pathToRegex";

/**
 * A router that handles file routes with layouts, hooks, etc.
 */
export default class Router {
	routes: Route[] = [];

	constructor() {}

	//add(path: string, file: string) {
	//	// TODO: Call the specific addX method based on the file path
	//	this.addPage(route, file);
	//}

	addPages(routes: ManifestRoute[]) {
		for (let r of routes) {
			this.routes.push(
				new Route(r.path, {
					path: r.path,
					type: r.type,
					endPoint: r.endPoint,
				}),
			);
		}
		this.#sortRoutes();
		return this;
	}

	// TODO: Allow calling with the endpoint itself, so that you can setup an app with no scaffold
	addPage(path: string, type: number, endPoint: () => Promise<any>) {
		this.routes.push(
			new Route(path, {
				path,
				type,
				endPoint,
			}),
		);
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

	match(path: string, query: URLSearchParams) {
		for (let route of this.routes) {
			let match = path.match(route.regex);
			if (match) {
				// Lazy load server endpoints and layouts
				if (!route.handler.loaded) {
					this.#loadHandler(route.handler, route.path);
				}

				return {
					handler: route.handler,
					params: match.groups,
					query,
				};
			}
		}

		console.log(`not found: '${path}'`);
	}

	#loadHandler(handler: RouteHandler, path: string) {
		handler.layouts = this.#findLayouts(path);
		handler.serverEndPoint = this.#findServer(path);
		handler.serverHook = this.#findServerHook(path);
	}

	#findLayouts(path: string): LayoutHandler[] | undefined {
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
			if (layoutRoute) {
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

	#findServerHook(path: string): (() => Promise<any>) | undefined {
		// TODO: Should this be a collection, like layouts?
		let serverHookPath = "/_hook/~server";
		// HACK: Generalise this
		if (path.startsWith("/api/")) {
			serverHookPath = "/api" + serverHookPath;
		}
		const serverHookRoute = this.routes.find((r) => r.path === serverHookPath);
		return serverHookRoute && serverHookRoute.handler.endPoint;
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
	regex: RegExp;
	handler: RouteHandler;

	constructor(path: string, handler: RouteHandler) {
		this.path = path;
		this.regex = pathToRegex(path);
		this.handler = handler;
	}
}
