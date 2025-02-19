import { getManifest } from "vinxi/manifest";
import fileRoutes, { type RouteModule } from "vinxi/routes";
import { type RouteHandler } from "../types/RouteHandler";
import { type RouteHandlerCollection } from "../types/RouteHandlerCollection";
import { type RouteLayoutHandler } from "../types/RouteLayoutHandler";
import lazyRoute from "./lazyRoute";

const clientManifest = getManifest("client");
const serverManifest = getManifest("server");

const routeHandlers: RouteHandlerCollection = {
	handlers: fileRoutes
		// HACK: Is there a better way to filter? glob in the config?
		.filter((route) => !route.path.startsWith("_"))
		.map((route) => {
			return {
				...route,
				regex: pathToRegExp(route.path),
				// TODO: Implement the rest of the lazyRoute stuff from vinxi/react or vinxi/solid
				endPoint: lazyRoute(route.$handler, clientManifest, serverManifest),
				loaded: false,
			};
		})
		.sort((a, b) => {
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
		}),
	match(path, urlParams) {
		console.log("matching", path);

		// TODO: Lots of testing etc
		for (let handler of (this as RouteHandlerCollection).handlers) {
			let match = path.match(handler.regex);
			if (match) {
				// Lazy load server endpoints and layouts
				// Partly because it makes sense to do it here, but also because
				// it doesn't work if we try to do it upfront for some reason
				if (!handler.loaded) {
					loadHandler(handler);
					handler.loaded = true;
				}
				return {
					handler,
					routeParams: match.groups,
					urlParams: urlParams ? Object.fromEntries(urlParams) : undefined,
				};
			}
		}

		console.log("not found");
		//for (let handler of (this as RouteHandlerCollection).handlers) {
		//	console.log("  have", handler.path, handler.regex);
		//}
	},
};

function pathToRegExp(path: string): RegExp {
	const pattern = path
		.split("/")
		.map((p) => {
			return p.replace(/\[([^\/]+?)\]/, "(?<$1>[^\\/]+?)");
		})
		.join("\\/");
	return new RegExp(`^${pattern}$`);
}

function loadHandler(handler: RouteHandler) {
	handler.layouts = findLayouts(handler.path, fileRoutes);
	handler.serverEndPoint = findServer(handler.path, fileRoutes);
	handler.serverHook = findServerHook(handler.path, fileRoutes);
}

function findLayouts(path: string, fileRoutes: RouteModule[]): RouteLayoutHandler[] | undefined {
	let layouts: RouteLayoutHandler[] = [];
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
		const layoutRoute = fileRoutes.find((r) => r.path === layoutPath);
		if (layoutRoute) {
			layouts.push({
				path: layoutPath,
				endPoint: lazyRoute(layoutRoute.$handler, clientManifest, serverManifest),
				serverEndPoint: findServer(layoutPath, fileRoutes),
			});
		}
	}
	return layouts.length ? layouts : undefined;
}

function findServer(path: string, fileRoutes: RouteModule[]): Promise<any> | undefined {
	const serverPath = path.replace(/\/$/, "") + "/~server";
	const serverRoute = fileRoutes.find((r) => r.path === serverPath);
	return serverRoute && lazyRoute(serverRoute.$handler, clientManifest, serverManifest);
}

function findServerHook(path: string, fileRoutes: RouteModule[]): Promise<any> | undefined {
	// TODO: Should this be a collection, like layouts?
	let hookPath = "/_hook/~server";
	if (path.startsWith("/api/")) {
		hookPath = "/api" + hookPath;
	}
	const hookRoute = fileRoutes.find((r) => r.path === hookPath);
	return hookRoute && lazyRoute(hookRoute.$handler, clientManifest, serverManifest);
}

export default routeHandlers;
