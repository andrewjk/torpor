import type { RouteArgs } from "../types/ParseRouteParams";
import type TypedResponse from "../response/TypedResponse";
import route from "./route";

/**
 * The value a client call resolves to: the endpoint's typed JSON body when it
 * returns a typed response, or the raw Response when the body isn't JSON.
 * Untyped endpoints resolve to `unknown`.
 */
type ApiResult<Handler> =
	Handler extends (event: any) => any
		? Awaited<ReturnType<Handler>> extends TypedResponse<infer Body>
			? Body | Response
			: unknown
		: never;

/** The callable methods of an endpoint, one per handler it defines. */
export type ApiMethods<Endpoint extends object> = {
	[Method in string & keyof Endpoint as Endpoint[Method] extends (
		event: any,
	) => any
		? Method
		: never]: (
		body?: BodyInit | object,
		init?: RequestInit,
	) => Promise<ApiResult<Endpoint[Method]>>;
};

const METHODS = ["get", "post", "patch", "put", "del", "options", "head"] as const;

/**
 * Creates typed client callers for a `+server` endpoint, e.g.
 *
 * ```ts
 * import type endpoint from "@/routes/api/posts/[id]/+server";
 * const post = makeApi<"/api/posts/[id]", typeof endpoint>("/api/posts/[id]");
 * const data = await post.get(); // typed from the endpoint's responses
 * ```
 *
 * Method names match the endpoint's handlers (`del` for DELETE). Params are
 * filled in and URI-encoded from the route path, and JSON responses are
 * parsed; non-JSON responses resolve to the raw Response. Failed requests
 * (non-2xx) throw.
 *
 * @param path The endpoint's route path
 * @param params The route params, required if the path has dynamic segments
 * @returns An object with one caller per handler defined by the endpoint
 */
export default function makeApi<Route extends string, Endpoint extends object>(
	path: Route,
	...args: RouteArgs<Route>
): ApiMethods<Endpoint> {
	const url = route(path, ...(args as [params?: Record<string, string>]));
	const api: Record<string, (body?: unknown, init?: RequestInit) => Promise<unknown>> = {};
	for (const method of METHODS) {
		api[method] = (body, init) => request(method, url, body, init);
	}
	return api as ApiMethods<Endpoint>;
}

async function request(
	method: string,
	url: string,
	body: unknown,
	init?: RequestInit,
): Promise<unknown> {
	// `del` is the endpoint handler name for DELETE requests
	const httpMethod = method === "del" ? "delete" : method;
	const options: RequestInit = { method: httpMethod.toUpperCase(), ...init };
	if (
		body !== undefined &&
		options.body === undefined &&
		method !== "get" &&
		method !== "head"
	) {
		if (typeof body === "object") {
			options.headers ??= { "Content-Type": "application/json" };
			options.body = JSON.stringify(body);
		} else {
			options.body = body as BodyInit;
		}
	}
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`API ${method.toUpperCase()} ${url} failed: ${response.status}`);
	}
	const contentType = response.headers.get("Content-Type") ?? "";
	return contentType.includes("application/json") ? await response.json() : response;
}
