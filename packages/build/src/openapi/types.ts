import type ServerLoadEvent from "../types/ServerLoadEvent";
import type { StandardSchemaV1 } from "../types/StandardSchema";

/**
 * A JSON Schema object, as produced by a schema library's converter (e.g.
 * `z.toJSONSchema`, valibot's `toJsonSchema`, arktype's `toJsonSchema`).
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Converts a Standard Schema (zod, valibot, arktype, ...) into a JSON Schema
 * object, for inclusion in an OpenAPI document. Supplied to the openApi
 * plugin, since each schema library has its own conversion function:
 *
 * ```ts
 * // zod
 * openApi({ toJsonSchema: (s) => z.toJSONSchema(s as z.ZodType, { io: "input" }) })
 * // arktype
 * openApi({ toJsonSchema: (s) => (s as Type).toJsonSchema() })
 * ```
 */
export type ToJsonSchema = (schema: StandardSchemaV1) => JsonSchema;

/**
 * Extends the generated document per request, for documents whose content
 * comes from data rather than the route tree alone: one document per
 * tenant/workspace served from a dynamic route segment, extra paths built from
 * a database, and so on. Gets a fresh copy of the base document (mutating it
 * is safe) and the request's event, which carries `url`, `params`,
 * `cookies`, `session`, `appData` and the rest.
 */
export type OpenApiExtend = (
	doc: Record<string, unknown>,
	event: ServerLoadEvent,
) => Record<string, unknown> | Promise<Record<string, unknown>>;

/**
 * Options for the openApi plugin.
 */
export type OpenApiPluginOptions = {
	/**
	 * The path to serve the OpenAPI document at. Defaults to `/openapi.json`.
	 */
	path?: string;
	/**
	 * The path to serve interactive API docs at, or `false` to disable the
	 * docs page. Defaults to `/docs`.
	 */
	docs?: string | false;
	/**
	 * The API title for the document's `info` section. Defaults to `"API"`.
	 */
	title?: string;
	/**
	 * The API version for the document's `info` section. Defaults to
	 * `"1.0.0"`.
	 */
	version?: string;
	/**
	 * Converts an endpoint's schemas into JSON Schema. Required for endpoints
	 * that declare schemas; endpoints without schemas are documented with
	 * their paths and methods only.
	 */
	toJsonSchema?: ToJsonSchema;
	/**
	 * Extends the generated document per request, e.g. for one document per
	 * workspace served from a dynamic route segment, or for paths built from
	 * data the route tree doesn't describe. The hook is given a fresh copy of
	 * the base document and the request's event (`params` included).
	 *
	 * `tb --openapi` writes the base document: the hook needs a request, so it
	 * isn't applied to the file.
	 */
	extend?: OpenApiExtend;
};

/**
 * OpenApi options with defaults applied. Created by the openApi plugin and
 * consumed by the document builder.
 */
export type ResolvedOpenApiOptions = {
	path: string;
	/** Undefined when the docs page is disabled */
	docs: string | undefined;
	title: string;
	version: string;
	toJsonSchema: ToJsonSchema | undefined;
	extend: OpenApiExtend | undefined;
};

/**
 * A ServerEndPoint shape, loosely typed so that endpoint modules loaded from
 * anywhere can be passed to the document builder.
 */
export type OpenApiEndPoint = {
	schema?: Record<string, StandardSchemaV1 | undefined> | undefined;
	[method: string]: unknown;
};

/**
 * A single API endpoint to include in an OpenAPI document: its route path
 * (with `[param]` segments) and its default-exported endpoint object.
 */
export type OpenApiRouteEntry = {
	path: string;
	endPoint: OpenApiEndPoint;
};

/**
 * Loads one route's default-exported endpoint module, used by the generated
 * document route to import each `+server` endpoint lazily.
 */
export type OpenApiLoader = () => Promise<{ default: OpenApiEndPoint }>;
