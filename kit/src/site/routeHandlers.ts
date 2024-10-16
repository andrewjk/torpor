import { getManifest } from "vinxi/manifest";
import fileRoutes, { RouteModule } from "vinxi/routes";
import RouteHandler from "../types/RouteHandler";
import type RouteHandlerCollection from "../types/RouteHandlerCollection";
import RouteLayoutHandler from "../types/RouteLayoutHandler";
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
		for (let handler of (this as RouteHandlerCollection).handlers) {
			console.log("  have", handler.path);
		}
	},
};

function pathToRegExp(path: string): RegExp {
	const pattern = path
		.split("/")
		.map((p) => {
			let match = p.match(/^\[(.+)\]$/);
			if (match) {
				return `(?<${match[1]}>.+?)`;
			} else {
				return p;
			}
		})
		.join("\\/");
	return new RegExp(`^${pattern}$`);
}

function loadHandler(handler: RouteHandler) {
	handler.layouts = findLayouts(handler.path, fileRoutes);
	handler.serverEndPoint = findServer(handler.path, fileRoutes);
}

function findLayouts(path: string, fileRoutes: RouteModule[]): RouteLayoutHandler[] | undefined {
	// PERF: could probably loop less here
	let layouts: RouteLayoutHandler[] = [];
	let parts = path.replace(/^\//, "").split("/");
	for (let i = 0; i < parts.length; i++) {
		let layoutPath = parts.slice(0, i).join("/") + "/_layout";
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

export default routeHandlers;
