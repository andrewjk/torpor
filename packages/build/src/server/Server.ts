import pathToRegex from "../app/pathToRegex";
import type HttpMethod from "../types/HttpMethod";
import type MiddlewareFunction from "../types/MiddlewareFunction";
import ServerEvent from "./ServerEvent";
import type ServerFunction from "./ServerFunction";

const noop = () => {};

/**
 * A Fetch API Request/Response server.
 */
export default class Server {
	methods = new Map<HttpMethod, RouteHandler[]>();
	middleware: MiddlewareFunction[] = [];

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

		this.middleware = [];
	}

	/**
	 * The standard Fetch API method that should work in any runtime (including
	 * Node with polyfills).
	 * @returns
	 */
	fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const request = new Request(input, init);
		const method = request.method as HttpMethod;
		const url = new URL(request.url);
		const match = this.match(method, url.pathname);
		let ev = new ServerEvent(request, match?.params);
		//console.log(input, this.middleware.length);
		if (this.middleware.length) {
			// TODO: Get middleware that applies to this route only?
			await this.middleware[0](ev, buildNext(this.middleware, 0));
			function buildNext(middleware: MiddlewareFunction[], i: number): () => void | Promise<void> {
				if (ev.response) {
					return noop;
				}

				if (i < middleware.length - 1) {
					let next = middleware[i + 1];
					return async () => next(ev, buildNext(middleware, i + 1));
				} else {
					return match
						? async () => {
								ev.response = await match.fn(ev);
							}
						: noop;
				}
			}

			// TODO: Add headers to the response

			// TODO: Should I be returning 200 if there's no response? Because it's not an error??
			ev.response ??= new Response(null, { status: 200 });
			ev.addHeaders();

			//console.log(ev.response);
			return ev.response;
		} else if (match) {
			return await match.fn(ev);
		}

		return new Response(null, { status: 404 });
	};

	/**
	 * Adds a method/route pattern combination.
	 * @param method The HTTP method, such as GET, PUT or POST.
	 * @param path The route path pattern.
	 * @param fn The function to call when the pattern is matched.
	 * @returns
	 */
	add(method: HttpMethod, path: string, fn: ServerFunction): Server {
		this.methods.get(method)!.push(new RouteHandler(path, fn));
		return this;
	}

	match(method: HttpMethod, path: string) {
		for (let handler of this.methods.get(method)!) {
			let match = path.match(handler.regex);
			if (match) {
				return {
					fn: handler.fn,
					params: match.groups,
				};
			}
		}
		console.log(`${method} not found: ${path}`);
	}

	/**
	 * Adds a route pattern that will be matched on a GET method.
	 * @param path The route pattern.
	 * @param fn The function to call when the pattern is matched.
	 * @returns
	 */
	get(path: string, fn: ServerFunction) {
		return this.add("GET", path, fn);
	}
	head(path: string, fn: ServerFunction) {
		return this.add("HEAD", path, fn);
	}
	patch(path: string, fn: ServerFunction) {
		return this.add("PATCH", path, fn);
	}
	post(path: string, fn: ServerFunction) {
		return this.add("POST", path, fn);
	}
	put(path: string, fn: ServerFunction) {
		return this.add("PUT", path, fn);
	}
	delete(path: string, fn: ServerFunction) {
		return this.add("DELETE", path, fn);
	}
	options(path: string, fn: ServerFunction) {
		return this.add("OPTIONS", path, fn);
	}
	connect(path: string, fn: ServerFunction) {
		return this.add("CONNECT", path, fn);
	}
	trace(path: string, fn: ServerFunction) {
		return this.add("TRACE", path, fn);
	}

	// TODO:
	//use(path: string, ...fn: MiddlewareFunction[])
	use(...fn: MiddlewareFunction[]): Server {
		this.middleware = this.middleware.concat(fn);
		return this;
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

//class MiddlewareHandler {
//	path: string;
//	regex: RegExp;
//	fn: MiddlewareFunction;
//
//	constructor(path: string, fn: MiddlewareFunction) {
//		this.path = path;
//		this.regex = pathToRegex(path);
//		this.fn = fn;
//	}
//}
