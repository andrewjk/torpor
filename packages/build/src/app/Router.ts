import pathToRegex from "./pathToRegex";
import HttpMethod from "./types/HttpMethod";
import MiddlewareFunction from "./types/MiddlewareFunction";
import ServerFunction from "./types/ServerFunction";

// This is not actually used anywhere, for now at least

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
	}
}

class RouteHandler {
	route: string;
	regex: RegExp;
	fn: ServerFunction;

	constructor(route: string, fn: ServerFunction) {
		this.route = route;
		this.regex = pathToRegex(route);
		this.fn = fn;
	}
}

class MiddlewareHandler {
	route: string;
	regex: RegExp;
	fn: MiddlewareFunction;

	constructor(route: string, fn: MiddlewareFunction) {
		this.route = route;
		this.regex = pathToRegex(route);
		this.fn = fn;
	}
}
