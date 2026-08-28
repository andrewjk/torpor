import type { RouteParamsOf } from "./ParseRouteParams";
import type { FormDataRecord, QueryRecord } from "./ServerLoadEvent";
import type { StandardSchemaV1 } from "./StandardSchema";
import type ServerRequest from "./ServerRequest";

/**
 * Optional standard schemas for +server endpoints, keyed by handler name.
 * Any schema implementing the Standard Schema interface (zod, valibot,
 * arktype, etc) can be used.
 *
 * - `get`/`head` schemas validate the URL's query string, surfaced through
 *   `event.query()`
 * - `post`/`patch`/`put`/`del`/`options` schemas validate the JSON request
 *   body, surfaced through `event.json()`
 * - a `params` schema validates (and generally coerces) the route params,
 *   surfaced through `event.params`
 *
 * When a request body or query string fails validation, the handler is not
 * called and a 422 response with the schema's issues is returned. When route
 * params fail validation, a 404 response is returned, since the URL can't
 * refer to an existing resource.
 */
export type ServerEndPointSchemas = {
	params?: StandardSchemaV1;
	get?: StandardSchemaV1;
	post?: StandardSchemaV1;
	patch?: StandardSchemaV1;
	put?: StandardSchemaV1;
	del?: StandardSchemaV1;
	options?: StandardSchemaV1;
	head?: StandardSchemaV1;
};

/**
 * The json body type for a handler, inferred from its schema. Falls back to
 * `unknown` for handlers without a declared schema.
 */
export type SchemaBody<Schemas extends ServerEndPointSchemas, Method extends string> = [
	Method,
] extends [keyof Schemas & string]
	? Schemas[Method] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Method]>
		: unknown
	: unknown;

/**
 * The query type for a handler, inferred from its schema. Falls back to a
 * loose record for handlers without a declared schema.
 */
export type SchemaQuery<Schemas extends ServerEndPointSchemas, Method extends string> = [
	Method,
] extends [keyof Schemas & string]
	? Schemas[Method] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Method]>
		: QueryRecord
	: QueryRecord;

/**
 * The route params type for an endpoint, inferred from its `params` schema.
 * Falls back to the route's string params when no schema is declared.
 */
export type ParamsOf<
	Schemas extends { params?: StandardSchemaV1 },
	Route extends string | undefined,
> = Schemas extends { params: StandardSchemaV1 }
	? StandardSchemaV1.InferOutput<Schemas["params"]>
	: RouteParamsOf<Route>;

/**
 * For +server. Annotate with a route path to get typed params, e.g.
 * `ServerEndPoint<"/api/posts/[id]">`, and with a schemas object to get
 * typed (and validated) request bodies, query strings and params, e.g.
 * `ServerEndPoint<"/api/posts", typeof schema>`.
 */
type ServerEndPoint<
	Route extends string | undefined = undefined,
	Schemas extends ServerEndPointSchemas = ServerEndPointSchemas,
> = {
	/**
	 * Optional standard schemas for validating requests, keyed by handler
	 * name (plus a `params` schema for the route params), e.g.
	 *
	 * ```ts
	 * const schema = {
	 *   params: z.object({ id: z.coerce.number() }),
	 *   get: z.object({ sort: z.enum(["asc", "desc"]) }),
	 *   post: z.object({ title: z.string() }),
	 * };
	 * export default {
	 *   schema,
	 *   get: async (event) => ok(await event.query()),
	 *   post: async (event) => ok((await event.json()).title),
	 * } satisfies ServerEndPoint<"/api/posts/[id]", typeof schema>;
	 * ```
	 */
	schema?: Schemas | undefined;
	/**
	 * Performs a GET. Its schema validates the query string.
	 */
	get?: ServerRequest<
		Route,
		unknown,
		FormDataRecord,
		SchemaQuery<Schemas, "get">,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs a POST. Its schema validates the JSON request body.
	 */
	post?: ServerRequest<
		Route,
		SchemaBody<Schemas, "post">,
		FormDataRecord,
		QueryRecord,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs a PATCH. Its schema validates the JSON request body.
	 */
	patch?: ServerRequest<
		Route,
		SchemaBody<Schemas, "patch">,
		FormDataRecord,
		QueryRecord,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs a PUT. Its schema validates the JSON request body.
	 */
	put?: ServerRequest<
		Route,
		SchemaBody<Schemas, "put">,
		FormDataRecord,
		QueryRecord,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs a DELETE. Its schema validates the JSON request body.
	 */
	del?: ServerRequest<
		Route,
		SchemaBody<Schemas, "del">,
		FormDataRecord,
		QueryRecord,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs an OPTIONS request. Its schema validates the JSON request body.
	 */
	options?: ServerRequest<
		Route,
		SchemaBody<Schemas, "options">,
		FormDataRecord,
		QueryRecord,
		ParamsOf<Schemas, Route>
	>;
	/**
	 * Performs a HEAD request. Its schema validates the query string.
	 */
	head?: ServerRequest<
		Route,
		unknown,
		FormDataRecord,
		SchemaQuery<Schemas, "head">,
		ParamsOf<Schemas, Route>
	>;
};

export default ServerEndPoint;
