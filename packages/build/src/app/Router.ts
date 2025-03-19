import HttpMethod from "./HttpMethod";
import MiddlewareFunction from "./MiddlewareFunction";
import ServerFunction from "./ServerFunction";

export default class Router {
	methods = new Map<HttpMethod, RouteHandler[]>();
	middleware: MiddlewareHandler[] = [];

	constructor() {
		// Create all method handlers up front so we don't have to worry about
		// checking if they exist. Using a non-standard method will just error
		this.methods.set("GET", []);
		this.methods.set("HEAD", []);
		this.methods.set("PATCH", []);
		this.methods.set("POST", []);
		this.methods.set("PUT", []);
		this.methods.set("DELETE", []);
		this.methods.set("OPTIONS", []);
		this.methods.set("CONNECT", []);
		this.methods.set("TRACE", []);
	}

	add(method: HttpMethod, route: string, fn: ServerFunction): Router {
		this.methods.get(method)!.push(new RouteHandler(route, fn));
		return this;
	}

	match(method: HttpMethod, path: string) {
		console.log("matching", path);
		for (let handler of this.methods.get(method)!) {
			let match = path.match(handler.regex);
			if (match) {
				console.log("found", handler);
				return {
					fn: handler.fn,
					params: match.groups,
				};
			}
		}
		console.log("not found");
	}
}

class RouteHandler {
	route: string;
	regex: RegExp;
	fn: ServerFunction;

	constructor(route: string, fn: ServerFunction) {
		this.route = route;
		this.regex = pathToRegExp(route);
		this.fn = fn;
	}
}

class MiddlewareHandler {
	route: string;
	regex: RegExp;
	fn: MiddlewareFunction;

	constructor(route: string, fn: MiddlewareFunction) {
		this.route = route;
		this.regex = pathToRegExp(route);
		this.fn = fn;
	}
}

function pathToRegExp(path: string): RegExp {
	const pattern = path
		.split("/")
		.map((p) => {
			return p.replace(/\[([^\/]+?)\]/, "(?<$1>[^\\/]+?)");
		})
		.join("\\/");
	return new RegExp(`^${pattern}$`);
}
