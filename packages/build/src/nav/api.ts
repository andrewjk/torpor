import type { ExactRouteParams, ParseRouteParams } from "../types/ParseRouteParams";
import type TypedResponse from "../response/TypedResponse";
import route from "./route";

/**
 * The value a client call resolves to: the endpoint's typed JSON body when it
 * returns a typed response, or the raw Response when the body isn't JSON.
 * Untyped endpoints resolve to `unknown`.
 */
type ApiResult<Handler> = Handler extends (event: any) => any
	? Awaited<ReturnType<Handler>> extends TypedResponse<infer Body>
		? Body | Response
		: unknown
	: never;

/**
 * The body a client call accepts: the endpoint event's annotated JSON body
 * type (from `ServerLoadEvent<Route, Body>`), or a loose value when the
 * handler doesn't annotate one.
 */
type ApiRequestBody<Handler> = Handler extends (event: infer Event) => any
	? Event extends { json: () => Promise<infer Body> }
		? unknown extends Body
			? BodyInit | object
			: Body
		: BodyInit | object
	: BodyInit | object;

/** The callable methods of an endpoint, one per handler it defines. */
export type ApiMethods<Endpoint extends object> = {
	[Method in string & keyof Endpoint as NonNullable<Endpoint[Method]> extends (event: any) => any
		? Method
		: never]: (
		body?: ApiRequestBody<NonNullable<Endpoint[Method]>>,
		init?: RequestInit,
	) => Promise<ApiResult<NonNullable<Endpoint[Method]>>>;
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
export default function makeApi<
	Route extends string,
	Endpoint extends object,
	Params extends ParseRouteParams<Route> = ParseRouteParams<Route>,
>(
	path: Route,
	// NOTE: The rest args conditional must stay INLINE — routing it through a
	// type alias defeats `Params` inference, and excess keys stop being checked
	...args: string extends Route
		? [params?: Record<string, string>]
		: keyof ParseRouteParams<Route> extends never
			? []
			: [params: Params & ExactRouteParams<Params, ParseRouteParams<Route>>]
): ApiMethods<Endpoint> {
	const url = route(path as string, ...(args as [params?: Record<string, string>]));
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
	if (body !== undefined && options.body === undefined && method !== "get" && method !== "head") {
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
