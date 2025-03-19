import HttpMethod from "./HttpMethod";
import MiddlewareFunction from "./MiddlewareFunction";
import Router from "./Router";
import ServerEvent from "./ServerEvent";
import ServerFunction from "./ServerFunction";

export default class App {
	#router: Router;
	#middleware: MiddlewareFunction[];

	constructor() {
		this.#router = new Router();
		this.#middleware = [];
	}

	// Standard fetch method should work in any runtime (including Node with some shims)
	fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const request = new Request(input, init);
		const method = request.method as HttpMethod;
		const url = new URL(request.url);
		const path = url.pathname.replaceAll(/\/+/g, "/");
		const handler = this.#router.match(method, path);
		if (handler) {
			let ev = new ServerEvent(request, handler.params);
			console.log("GOT", this.#middleware.length, "MIDS");
			if (this.#middleware.length) {
				// TODO: Get middleware for the route only
				await this.#middleware[0](ev, buildNext(this.#middleware, 0));
				function buildNext(
					middleware: MiddlewareFunction[],
					i: number,
				): () => void | Promise<void> {
					if (i < middleware.length - 1) {
						i++;
						let next = middleware[i];
						return async () => next(ev, buildNext(middleware, i));
					} else {
						return async () => {
							ev.response = await handler!.fn(ev);
						};
					}
				}
				// TODO: Should I be returning 200 if there's no response? Because it's not an error??
				return ev.response ?? new Response(null, { status: 200 });
			} else {
				return handler.fn(ev);
			}
		}
		return new Response(null, { status: 400 });
	};

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

	add(method: HttpMethod, route: string, fn: ServerFunction): App {
		this.#router.add(method, route, fn);
		return this;
	}

	// TODO:
	//use(route: string, ...fn: MiddlewareFunction[])
	use(...fn: MiddlewareFunction[]): App {
		this.#middleware = this.#middleware.concat(fn);
		return this;
	}

	//match(method: HttpMethod, path: string) {
	//	return this.#router.match(method, path);
	//}
}
