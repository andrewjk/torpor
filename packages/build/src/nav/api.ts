import type { ExactRouteParams, ParseRouteParams } from "../types/ParseRouteParams";
import type { StandardSchemaV1 } from "../types/StandardSchema";
import type TypedResponse from "../response/TypedResponse";
import route from "./route";

/** The methods whose argument is a query object rather than a request body. */
type QueryMethod = "get" | "head";

/** A value a client call can serialize into a query param. Arrays repeat the key. */
export type ApiQueryValue = string | number | boolean | bigint | Date | null | undefined;

/** The loose query object accepted for handlers that declare no schema. */
export type ApiQuery = Record<string, ApiQueryValue | readonly ApiQueryValue[]>;

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

/**
 * The endpoint's declared schemas, when it has any. Handles both a `satisfies`
 * export (where `schema` is present) and an endpoint annotated as
 * `ServerEndPoint`, where it is optional. `never` when there are none.
 */
type EndpointSchemas<Endpoint extends object> = NonNullable<
	[Endpoint] extends [{ schema?: infer Schemas }] ? Schemas : undefined
>;

/**
 * The query object a client call accepts for a handler: the output of the
 * endpoint's get/head schema (validated and typed by it), or a loose record
 * when the handler declares no schema.
 */
type ApiQueryFor<Endpoint extends object, Method extends string> = [
	EndpointSchemas<Endpoint>,
] extends [never]
	? ApiQuery
	: EndpointSchemas<Endpoint> extends infer Schemas
		? Schemas extends Record<string, unknown>
			? Method extends keyof Schemas
				? Schemas[Method] extends StandardSchemaV1
					? StandardSchemaV1.InferOutput<Schemas[Method]>
					: ApiQuery
				: ApiQuery
			: ApiQuery
		: ApiQuery;

/** The callable methods of an endpoint, one per handler it defines. */
export type ApiMethods<Endpoint extends object> = {
	[
		Method in string & keyof Endpoint as NonNullable<Endpoint[Method]> extends (event: any) => any
			? Method
			: never
	]: Method extends QueryMethod
		? (
				query?: ApiQueryFor<Endpoint, Method>,
				init?: RequestInit,
			) => Promise<ApiResult<NonNullable<Endpoint[Method]>>>
		: (
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
 * `get` and `head` take a query object, typed by the handler's schema when it
 * declares one, which is serialized into the query string (arrays repeat the
 * key, `undefined`/`null` values are skipped). Other methods take a request
 * body: objects are sent as JSON.
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
	const api: Record<string, (arg?: unknown, init?: RequestInit) => Promise<unknown>> = {};
	for (const method of METHODS) {
		api[method] = (arg, init) => request(method, url, arg, init);
	}
	return api as ApiMethods<Endpoint>;
}

async function request(
	method: string,
	url: string,
	arg: unknown,
	init?: RequestInit,
): Promise<unknown> {
	// `del` is the endpoint handler name for DELETE requests
	const httpMethod = method === "del" ? "delete" : method;
	const isQueryMethod = method === "get" || method === "head";
	// GET and HEAD take a query object (there is no request body to send)
	const target = isQueryMethod ? appendQuery(url, arg) : url;
	const options: RequestInit = { method: httpMethod.toUpperCase(), ...init };
	if (!isQueryMethod && arg !== undefined && options.body === undefined) {
		if (typeof arg === "object") {
			options.headers ??= { "Content-Type": "application/json" };
			options.body = JSON.stringify(arg);
		} else {
			options.body = arg as BodyInit;
		}
	}
	const response = await fetch(target, options);
	if (!response.ok) {
		throw new Error(`API ${method.toUpperCase()} ${target} failed: ${response.status}`);
	}
	const contentType = response.headers.get("Content-Type") ?? "";
	return contentType.includes("application/json") ? await response.json() : response;
}

/**
 * Appends a query object to a url: arrays repeat the key, `undefined` and
 * `null` values are skipped, and `Date`s are sent as ISO strings. Values are
 * URI-encoded. Nested objects can't be represented in a query string, so they
 * throw rather than being silently stringified.
 */
function appendQuery(url: string, query: unknown): string {
	if (query === undefined || query === null) return url;
	if (typeof query !== "object" || Array.isArray(query)) {
		throw new TypeError("A GET or HEAD query must be an object");
	}
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
		for (const item of Array.isArray(value) ? value : [value]) {
			if (item === undefined || item === null) continue;
			if (item instanceof Date) {
				params.append(key, item.toISOString());
			} else if (typeof item === "object") {
				throw new TypeError(
					`Cannot serialize the query value for "${key}": only strings, numbers, ` +
						`booleans, bigints, Dates and arrays of them are supported`,
				);
			} else {
				params.append(key, String(item));
			}
		}
	}
	const search = params.toString();
	if (!search) return url;
	return url + (url.includes("?") ? "&" : "?") + search;
}
