import HttpMethod from "./HttpMethod";
import ServerFunction from "./ServerFunction";

export default class Router {
	methods = new Map<HttpMethod, MethodHandler>();

	constructor() {
		// Create all method handlers up front so we don't have to worry about
		// checking if they exist. Using a non-standard method will just error
		this.methods.set("GET", new MethodHandler());
		this.methods.set("HEAD", new MethodHandler());
		this.methods.set("PATCH", new MethodHandler());
		this.methods.set("POST", new MethodHandler());
		this.methods.set("PUT", new MethodHandler());
		this.methods.set("DELETE", new MethodHandler());
		this.methods.set("OPTIONS", new MethodHandler());
		this.methods.set("CONNECT", new MethodHandler());
		this.methods.set("TRACE", new MethodHandler());
	}

	add(method: HttpMethod, pattern: string, fn: ServerFunction): Router {
		this.methods.get(method)!.routes.push(new RouteHandler(pattern, fn));
		return this;
	}

	match(method: HttpMethod, path: string) {
		console.log("matching", path);
		for (let handler of this.methods.get(method)!.routes) {
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

class MethodHandler {
	routes: RouteHandler[] = [];

	constructor() {}
}

class RouteHandler {
	pattern: string;
	regex: RegExp;
	fn: ServerFunction;

	constructor(pattern: string, fn: ServerFunction) {
		this.pattern = pattern;
		this.regex = this.pathToRegExp(pattern);
		this.fn = fn;
	}

	pathToRegExp(path: string): RegExp {
		const pattern = path
			.split("/")
			.map((p) => {
				return p.replace(/\[([^\/]+?)\]/, "(?<$1>[^\\/]+?)");
			})
			.join("\\/");
		return new RegExp(`^${pattern}$`);
	}
}
