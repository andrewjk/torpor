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
