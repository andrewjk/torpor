import PageEndPoint from "../types/PageEndPoint";
import RouteLayoutHandler from "../types/RouteLayoutHandler";
import Server from "./Server";
import ServerEvent from "./ServerEvent";
import pathToRegex from "./pathToRegex";
import EndPointHandler from "./types/EndPointHandler";

export default class AppBase {
	routes: RouteHandler[] = [];
	//pages = new Map<string, PageEndPoint>();

	constructor() {}

	//add(route: string, file: string) {
	//	// TODO: Call the specific addX method based on the file path
	//	this.addPage(route, file);
	//}

	// TODO: Allow calling with the endpoint itself, so that you can setup an app with no scaffold
	addPage(route: string, endPoint: Promise<any>) {
		//this.server.get(route, (ev) => this.loadPage(ev, file));
		this.routes.push(
			new RouteHandler(route, {
				path: "",
				endPoint,
			}),
		);
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
				console.log(`Matched '${path}' with`, route);

				// Maybe load it
				if (!route.handler.loaded) {
					// TODO:
					this.loadHandler(route.handler, route.route);
				}

				return {
					handler: route.handler,
					params: match.groups,
					query,
				};
			}
		}
		console.log(`Not found for '${path}'`);
	}

	loadHandler(handler: EndPointHandler, route: string) {
		//handler.endPoint = import(handler.path);
		handler.layouts = this.findLayouts(route);
		handler.serverEndPoint = this.findServer(route);
		handler.serverHook = this.findServerHook(route);
	}

	findLayouts(route: string): RouteLayoutHandler[] | undefined {
		return undefined;
		//let layouts: RouteLayoutHandler[] = [];
		//let parts = path
		//	// Strip the trailing`~/server` (so we don't look for `~/server/_layout`
		//	// which will never exist)
		//	.replace(/\/~server$/, "")
		//	// The path will always start with / so splitting e.g. `/first/second`
		//	// will result in ['', 'first', 'second'] and checks for `/_layout`,
		//	// `/first/_layout` and `/second/_layout`
		//	.split("/");
		//let basePath = "";
		//for (let i = 0; i < parts.length; i++) {
		//	if (i > 0) {
		//		basePath += "/" + parts[i];
		//	}
		//	const layoutPath = basePath + "/_layout";
		//	const layoutRoute = fileRoutes.find((r) => r.path === layoutPath);
		//	if (layoutRoute) {
		//		layouts.push({
		//			path: layoutPath,
		//			endPoint: lazyRoute(layoutRoute.$handler, clientManifest, serverManifest),
		//			serverEndPoint: findServer(layoutPath, fileRoutes),
		//		});
		//	}
		//}
		//return layouts.length ? layouts : undefined;
	}

	findServer(route: string): Promise<any> | undefined {
		return undefined;
		//const serverPath = path.replace(/\/$/, "") + "/~server";
		//const serverRoute = this.routes.find((r) => r.path === serverPath);
		//return serverRoute && lazyRoute(serverRoute.$handler, clientManifest, serverManifest);
	}

	findServerHook(route: string): Promise<any> | undefined {
		return undefined;
		//// TODO: Should this be a collection, like layouts?
		//let hookPath = "/_hook/~server";
		//if (path.startsWith("/api/")) {
		//	hookPath = "/api" + hookPath;
		//}
		//const hookRoute = this.routes.find((r) => r.path === hookPath);
		//return hookRoute && lazyRoute(hookRoute.$handler, clientManifest, serverManifest);
	}
}

class RouteHandler {
	route: string;
	regex: RegExp;
	handler: EndPointHandler;

	constructor(route: string, handler: EndPointHandler) {
		this.route = route;
		this.regex = pathToRegex(route);
		this.handler = handler;
	}
}
