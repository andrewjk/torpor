import { getManifest } from "vinxi/manifest";
import fileRoutes from "vinxi/routes";
import lazyRoute from "./lazyRoute";

const clientManifest = getManifest("client");
const serverManifest = getManifest("server");

interface Handler {
	path: string;
	regex: RegExp;
	handler: Promise<any>;
}

interface RouteHandlers {
	handlers: Handler[];
	match(path: string, urlParams: URLSearchParams): MatchResult | undefined;
}

interface MatchResult {
	handler: Handler;
	routeParams?: Record<PropertyKey, string>;
	urlParams?: Record<PropertyKey, string>;
}

const routeHandlers: RouteHandlers = {
	handlers: fileRoutes.map((route) => {
		return {
			...route,
			regex: pathToRegExp(route.path),
			// TODO: Implement the rest of the lazyRoute stuff from vinxi/react or vinxi/solid
			handler: lazyRoute(route.$handler, clientManifest, serverManifest),
		};
	}),
	match(path, urlParams) {
		console.log("matching", path);
		// TODO: Lots of testing etc
		for (let handler of (this as RouteHandlers).handlers) {
			let match = path.match(handler.regex);
			if (match) {
				return {
					handler,
					routeParams: match.groups,
					urlParams: Object.fromEntries(urlParams),
				};
			}
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

export default routeHandlers;
