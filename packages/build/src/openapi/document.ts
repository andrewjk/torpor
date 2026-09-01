import type { StandardSchemaV1 } from "../types/StandardSchema";
import type { OpenApiPluginOptions, OpenApiRouteEntry, JsonSchema } from "./types";

// The endpoint handler names, in the order they appear in docs
const METHODS = ["get", "post", "patch", "put", "del", "options", "head"] as const;
type Method = (typeof METHODS)[number];

// Handlers whose schema validates the query string; all others validate the
// json request body
const QUERY_METHODS: readonly string[] = ["get", "head"];
const BODY_METHODS: readonly string[] = ["post", "patch", "put", "del", "options"];

/**
 * Builds an OpenAPI 3.1 document from a list of +server endpoints.
 *
 * Each endpoint's route path (`/api/posts/[id]`) is converted to OpenAPI
 * syntax (`/api/posts/{id}`); its `params` schema becomes path parameters,
 * its `get`/`head` schema becomes query parameters, and its `post`/`patch`/
 * `put`/`del`/`options` schema becomes a json request body. Responses are
 * stubbed: a `200` for every handler, plus a `422` when the handler declares
 * an input schema (validation errors are returned automatically).
 *
 * Throws if any endpoint declares a schema but the options have no
 * `toJsonSchema` converter.
 */
export default function buildOpenApiDocument(
	entries: OpenApiRouteEntry[],
	options: OpenApiPluginOptions,
): Record<string, unknown> {
	if (!options.toJsonSchema) {
		const withSchema = entries.find(hasSchemas);
		if (withSchema) {
			throw new Error(
				`The endpoint at ${withSchema.path} declares schema(s), but the openApi() plugin ` +
					`was not given a "toJsonSchema" converter. Pass one, e.g. ` +
					`openApi({ toJsonSchema: (s) => z.toJSONSchema(s) })`,
			);
		}
	}

	const paths: Record<string, Record<string, unknown>> = {};
	for (const entry of entries) {
		const pathItem = buildPathItem(entry, options);
		if (pathItem) {
			paths[openApiPath(entry.path)] = pathItem;
		}
	}

	return {
		openapi: "3.1.0",
		info: {
			title: options.title ?? "API",
			version: options.version ?? "1.0.0",
		},
		paths,
	};
}

function hasSchemas(entry: OpenApiRouteEntry): boolean {
	const schema = entry.endPoint?.schema;
	if (!schema) return false;
	return METHODS.some((method) => schema[method]) || !!schema.params;
}

function buildPathItem(
	entry: OpenApiRouteEntry,
	options: OpenApiPluginOptions,
): Record<string, unknown> | undefined {
	const endPoint = entry.endPoint;
	const pathItem: Record<string, unknown> = {};
	let count = 0;

	for (const method of METHODS) {
		if (typeof endPoint[method] !== "function") {
			continue;
		}
		count++;

		const schema = endPoint.schema?.[method];
		const paramsSchema = endPoint.schema?.params;

		const parameters: Record<string, unknown>[] = [];
		if (paramsSchema) {
			parameters.push(...flattenObject(convert(paramsSchema, options), "path"));
		}
		if (schema && QUERY_METHODS.includes(method)) {
			parameters.push(...flattenObject(convert(schema, options), "query"));
		}

		const responses: Record<string, unknown> = { "200": { description: "OK" } };
		if (schema) {
			responses["422"] = { description: "Validation failed" };
		}

		pathItem[method === "del" ? "delete" : method] = {
			operationId: operationId(method, entry.path),
			...(parameters.length ? { parameters } : {}),
			...(schema && BODY_METHODS.includes(method)
				? {
						requestBody: {
							required: true,
							content: { "application/json": { schema: convert(schema, options) } },
						},
					}
				: {}),
			responses,
		};
	}

	return count > 0 ? pathItem : undefined;
}

function convert(schema: StandardSchemaV1, options: OpenApiPluginOptions): JsonSchema {
	return options.toJsonSchema!(schema);
}

/**
 * Flattens a converted object schema into OpenAPI parameters. Path
 * parameters are always required; query parameters take their `required`
 * flag from the schema's `required` array.
 */
function flattenObject(
	jsonSchema: JsonSchema,
	location: "path" | "query",
): Record<string, unknown>[] {
	const properties = jsonSchema.properties;
	if (!properties || typeof properties !== "object") {
		return [];
	}
	const required = Array.isArray(jsonSchema.required) ? jsonSchema.required : [];
	return Object.entries(properties as Record<string, JsonSchema>).map(([name, propSchema]) => ({
		name,
		in: location,
		required: location === "path" ? true : required.includes(name),
		schema: propSchema,
	}));
}

/**
 * Converts a route path to OpenAPI syntax: `/api/posts/[id]` becomes
 * `/api/posts/{id}`.
 */
function openApiPath(routePath: string): string {
	return routePath.replace(/\[\.\.\.([^\]]+)\]/g, "{$1}").replace(/\[([^\]]+)\]/g, "{$1}");
}

function operationId(method: Method, routePath: string): string {
	const segments = openApiPath(routePath)
		.split(/[^a-zA-Z0-9]+/)
		.filter((s) => s.length > 0)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
	const verb = method === "del" ? "delete" : method;
	return verb + (segments.join("") || "Root");
}
