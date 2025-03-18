import HttpMethod from "./HttpMethod";
import Router from "./Router";
import ServerEvent from "./ServerEvent";
import ServerFunction from "./ServerFunction";

export default class App {
	#router: Router;

	constructor() {
		this.#router = new Router();
	}

	// Standard fetch method should work in any runtime (including Node with some shims)
	fetch = (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(input, init);
		const method = request.method as HttpMethod;
		const url = new URL(request.url);
		const path = url.pathname.replaceAll(/\/+/g, "/");
		const handler = this.#router.match(method, path);
		if (handler) {
			let event = new ServerEvent(request, handler.params);
			return handler.fn(event);
		}
		return new Response(null, { status: 400 });
	};

	get(pattern: string, fn: ServerFunction) {
		return this.add("GET", pattern, fn);
	}
	head(pattern: string, fn: ServerFunction) {
		return this.add("HEAD", pattern, fn);
	}
	patch(pattern: string, fn: ServerFunction) {
		return this.add("PATCH", pattern, fn);
	}
	post(pattern: string, fn: ServerFunction) {
		return this.add("POST", pattern, fn);
	}
	put(pattern: string, fn: ServerFunction) {
		return this.add("PUT", pattern, fn);
	}
	delete(pattern: string, fn: ServerFunction) {
		return this.add("DELETE", pattern, fn);
	}
	options(pattern: string, fn: ServerFunction) {
		return this.add("OPTIONS", pattern, fn);
	}
	connect(pattern: string, fn: ServerFunction) {
		return this.add("CONNECT", pattern, fn);
	}
	trace(pattern: string, fn: ServerFunction) {
		return this.add("TRACE", pattern, fn);
	}

	add(method: HttpMethod, pattern: string, fn: ServerFunction): App {
		this.#router.add(method, pattern, fn);
		return this;
	}

	// TODO: use() for middleware

	//match(method: HttpMethod, path: string) {
	//	return this.#router.match(method, path);
	//}
}
