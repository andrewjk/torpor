import ServerEvent from "./ServerEvent";
import pathToRegex from "./pathToRegex";
import type HttpMethod from "./types/HttpMethod";
import type MiddlewareFunction from "./types/MiddlewareFunction";
import type ServerFunction from "./types/ServerFunction";

const NOOP = () => {};

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

		if (this.middleware.length) {
			// TODO: Get middleware that applies to this route only?
			await this.middleware[0](ev, buildNext(this.middleware, 0));
			function buildNext(middleware: MiddlewareFunction[], i: number): () => void | Promise<void> {
				if (ev.response) {
					return NOOP;
				}

				if (i < middleware.length - 1) {
					let next = middleware[i + 1];
					return async () => next(ev, buildNext(middleware, i + 1));
				} else {
					return match
						? async () => {
								ev.response = await match.fn(ev);
							}
						: NOOP;
				}
			}

			// TODO: Should I be returning 200 if there's no response? Because it's not an error??
			return ev.response ?? new Response(null, { status: 200 });
		} else if (match) {
			return await match.fn(ev);
		}
		//}
		return new Response(null, { status: 400 });
	};

	/**
	 * Adds a method/route pattern combination.
	 * @param method The HTTP method, such as GET, PUT or POST.
	 * @param route The route pattern.
	 * @param fn The function to call when the pattern is matched.
	 * @returns
	 */
	add(method: HttpMethod, route: string, fn: ServerFunction): Server {
		this.methods.get(method)!.push(new RouteHandler(route, fn));
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
	}

	/**
	 * Adds a route pattern that will be matched on a GET method.
	 * @param route The route pattern.
	 * @param fn The function to call when the pattern is matched.
	 * @returns
	 */
	get(route: string, fn: ServerFunction) {
		return this.add("GET", route, fn);
	}
	head(route: string, fn: ServerFunction) {
		return this.add("HEAD", route, fn);
	}
	patch(route: string, fn: ServerFunction) {
		return this.add("PATCH", route, fn);
	}
	post(route: string, fn: ServerFunction) {
		return this.add("POST", route, fn);
	}
	put(route: string, fn: ServerFunction) {
		return this.add("PUT", route, fn);
	}
	delete(route: string, fn: ServerFunction) {
		return this.add("DELETE", route, fn);
	}
	options(route: string, fn: ServerFunction) {
		return this.add("OPTIONS", route, fn);
	}
	connect(route: string, fn: ServerFunction) {
		return this.add("CONNECT", route, fn);
	}
	trace(route: string, fn: ServerFunction) {
		return this.add("TRACE", route, fn);
	}

	// TODO:
	//use(route: string, ...fn: MiddlewareFunction[])
	use(...fn: MiddlewareFunction[]): Server {
		this.middleware = this.middleware.concat(fn);
		return this;
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

//class MiddlewareHandler {
//	route: string;
//	regex: RegExp;
//	fn: MiddlewareFunction;
//
//	constructor(route: string, fn: MiddlewareFunction) {
//		this.route = route;
//		this.regex = pathToRegex(route);
//		this.fn = fn;
//	}
//}
