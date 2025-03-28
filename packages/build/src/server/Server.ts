import pathToRegex from "../site/pathToRegex";
import type MiddlewareFunction from "../types/MiddlewareFunction";
import ServerEvent from "./ServerEvent";
import type ServerFunction from "./ServerFunction";

const noop = () => {};

/**
 * A Fetch API Request/Response server.
 */
export default class Server {
	// TODO: We don't use any of the routes, just add("*") in runDev/runBuild...
	routes: RouteHandler[] = [];
	// TODO: We only use the Vite middleware here
	middleware: MiddlewareFunction[] = [];

	constructor() {
		this.routes = [];
		this.middleware = [];
	}

	/**
	 * The standard Fetch API method that should work in any runtime (including
	 * Node with polyfills).
	 * @returns
	 */
	fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const request = new Request(input, init);
		const url = new URL(request.url);
		const match = this.match(url.pathname);
		let ev = new ServerEvent(request, match?.params);

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
		} else if (match) {
			ev.response = await match.fn(ev);
		} else {
			return new Response(null, { status: 404 });
		}

		// TODO: Should I be returning 200 if there's no response? Because it's not an error??
		ev.response ??= new Response(null, { status: 200 });
		ev.addHeaders();

		return ev.response;
	};

	/**
	 * Adds a method/route pattern combination.
	 * @param method The HTTP method, such as GET, PUT or POST.
	 * @param path The route path pattern.
	 * @param fn The function to call when the pattern is matched.
	 * @returns
	 */
	add(path: string, fn: ServerFunction): Server {
		this.routes.push(new RouteHandler(path, fn));
		return this;
	}

	match(path: string) {
		for (let handler of this.routes) {
			let match = path.match(handler.regex);
			if (match) {
				return {
					fn: handler.fn,
					params: match.groups,
				};
			}
		}
		console.log(`Server path not found: ${path}`);
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
