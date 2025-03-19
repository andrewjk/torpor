import HttpMethod from "./HttpMethod";
import MiddlewareFunction from "./MiddlewareFunction";
import Router from "./Router";
import ServerEvent from "./ServerEvent";
import ServerFunction from "./ServerFunction";

const NOOP = () => {};

// TODO: Merge this with Router, it's basically the same thing
// Although I guess you might have multiple Routers??

export default class App {
	#router: Router;
	#middleware: MiddlewareFunction[];

	constructor() {
		this.#router = new Router();
		this.#middleware = [];
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
		const handler = this.#router.match(method, url.pathname);

		let ev = new ServerEvent(request, handler?.params);
		//console.log("GOT", this.#middleware.length, "MIDS");
		if (this.#middleware.length) {
			// TODO: Get middleware that applies to this route only
			await this.#middleware[0](ev, buildNext(this.#middleware, 0));
			function buildNext(middleware: MiddlewareFunction[], i: number): () => void | Promise<void> {
				if (ev.response) {
					return NOOP;
				}

				if (i < middleware.length - 1) {
					i++;
					let next = middleware[i];
					return async () => next(ev, buildNext(middleware, i));
				} else {
					return handler
						? async () => {
								ev.response = await handler.fn(ev);
							}
						: NOOP;
				}
			}

			// TODO: Should I be returning 200 if there's no response? Because it's not an error??
			return ev.response ?? new Response(null, { status: 200 });
		} else if (handler) {
			return await handler.fn(ev);
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
	add(method: HttpMethod, route: string, fn: ServerFunction): App {
		this.#router.add(method, route, fn);
		return this;
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
	use(...fn: MiddlewareFunction[]): App {
		this.#middleware = this.#middleware.concat(fn);
		return this;
	}
}
