import type { StandardSchemaV1 } from "./StandardSchema";
import type ServerRequest from "./ServerRequest";

/**
 * Optional standard schemas for validating endpoint request bodies, keyed by
 * the handler name they apply to. Any schema implementing the Standard Schema
 * interface (zod, valibot, arktype, etc) can be used.
 *
 * When a request body fails validation, the handler is not called and a 422
 * response with the schema's issues is returned. When it passes, `event.json()`
 * returns the parsed value.
 */
export type ServerEndPointSchemas = {
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
 * `unknown` for methods without a declared schema.
 */
type SchemaBody<
	Schemas extends ServerEndPointSchemas,
	Method extends keyof ServerEndPointSchemas,
> = [Method] extends [keyof Schemas & string]
	? Schemas[Method] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Method]>
		: unknown
	: unknown;

/**
 * For +server. Annotate with a route path to get typed params, e.g.
 * `ServerEndPoint<"/api/posts/[id]">`, and with a schemas object to get
 * typed (and validated) request bodies, e.g.
 * `ServerEndPoint<"/api/posts", typeof schema>`.
 */
type ServerEndPoint<
	Route extends string | undefined = undefined,
	Schemas extends ServerEndPointSchemas = ServerEndPointSchemas,
> = {
	/**
	 * Optional standard schemas for validating request bodies, keyed by
	 * handler name, e.g.
	 *
	 * ```ts
	 * const schema = { post: z.object({ title: z.string() }) };
	 * export default {
	 *   schema,
	 *   post: async (event) => ok((await event.json()).title),
	 * } satisfies ServerEndPoint<"/api/posts", typeof schema>;
	 * ```
	 */
	schema?: Schemas | undefined;
	/**
	 * Performs a GET.
	 */
	get?: ServerRequest<Route, SchemaBody<Schemas, "get">>;
	/**
	 * Performs a POST.
	 */
	post?: ServerRequest<Route, SchemaBody<Schemas, "post">>;
	/**
	 * Performs a PATCH.
	 */
	patch?: ServerRequest<Route, SchemaBody<Schemas, "patch">>;
	/**
	 * Performs a PUT.
	 */
	put?: ServerRequest<Route, SchemaBody<Schemas, "put">>;
	/**
	 * Performs a DELETE.
	 */
	del?: ServerRequest<Route, SchemaBody<Schemas, "del">>;
	/**
	 * Performs an OPTIONS request.
	 */
	options?: ServerRequest<Route, SchemaBody<Schemas, "options">>;
	/**
	 * Performs a HEAD request.
	 */
	head?: ServerRequest<Route, SchemaBody<Schemas, "head">>;
};

export default ServerEndPoint;
