import pathToRegex from "../site/pathToRegex";
import type HttpMethod from "./types/HttpMethod";
import type MiddlewareFunction from "./types/MiddlewareFunction";
import type ServerFunction from "./types/ServerFunction";

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

	add(method: HttpMethod, path: string, fn: ServerFunction): Router {
		this.methods.get(method)!.push(new RouteHandler(path, fn));
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
	path: string;
	regex: RegExp;
	fn: ServerFunction;

	constructor(path: string, fn: ServerFunction) {
		this.path = path;
		this.regex = pathToRegex(path);
		this.fn = fn;
	}
}

class MiddlewareHandler {
	path: string;
	regex: RegExp;
	fn: MiddlewareFunction;

	constructor(path: string, fn: MiddlewareFunction) {
		this.path = path;
		this.regex = pathToRegex(path);
		this.fn = fn;
	}
}
