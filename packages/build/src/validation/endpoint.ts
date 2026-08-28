import type PageServerEndPoint from "../types/PageServerEndPoint";
import type ServerEndPoint from "../types/ServerEndPoint";
import type { StandardSchemaV1 } from "../types/StandardSchema";
import type ServerEvent from "../server/ServerEvent";
import searchParamsToRecord from "../utils/searchParamsToRecord";
import unprocessable from "../response/unprocessable";
import ValidationError from "./ValidationError";
import validate from "./validate";

/**
 * Loose views of an endpoint's schema map, keyed by handler/action name (plus
 * the reserved `params` key). The type-level constraint differs per endpoint
 * type, but the runtime treats them the same.
 */
type Schemas = Record<string, StandardSchemaV1 | undefined>;

type EndPoint = ServerEndPoint | PageServerEndPoint;

/**
 * Gets the standard schema declared for a handler or action, if any. The
 * schemas map is keyed by name; the runtime treats it as a loose record.
 */
export function endpointSchema(endPoint: EndPoint, name: string): StandardSchemaV1 | undefined {
	return (endPoint.schema as Schemas | undefined)?.[name];
}

/**
 * Validates the route params against the endpoint's `params` schema, if it
 * declares one, returning the coerced params. Throws a ValidationError when
 * they don't match, which callers turn into a 404 (params come from the URL,
 * so a failed validation means the resource doesn't exist).
 *
 * @param endPoint The endpoint declaring the (optional) `params` schema
 * @param params The route params from the matched route
 * @returns The validated params
 */
export async function validateEndpointParams(
	endPoint: EndPoint,
	params: Record<string, any>,
): Promise<Record<string, any>> {
	const schema = endpointSchema(endPoint, "params");
	return schema ? ((await validate(schema, params)) as Record<string, any>) : params;
}

/**
 * Validates a handler's input against its schema: get/head handlers and load
 * functions validate the URL's query string, other handlers validate the JSON
 * request body. Returns the validated values (an empty object when no schema
 * is declared), which callers pass through to the handler's event.
 *
 * @param schema The handler's (optional) schema
 * @param functionName The handler name (`get`, `post`, `load`, etc)
 * @param url The request URL, for the query string
 * @param ev The server event, for the request body
 * @returns The validated values
 */
export async function validateHandlerInput(
	schema: StandardSchemaV1 | undefined,
	functionName: string,
	url: URL,
	ev: ServerEvent,
): Promise<{ json?: unknown; form?: unknown; query?: unknown }> {
	if (!schema) return {};
	if (functionName === "get" || functionName === "head" || functionName === "load") {
		return { query: await validate(schema, searchParamsToRecord(url.searchParams)) };
	}
	return { json: await validate(schema, await ev.json()) };
}

/**
 * Turns a ValidationError thrown during endpoint validation into a 422
 * response with the schema's issues. Returns undefined for any other error,
 * which callers should rethrow.
 *
 * @param error The error thrown by a handler or validation
 * @returns A 422 response, or undefined when the error isn't a validation failure
 */
export function validationErrorResponse(error: unknown): Response | undefined {
	if (error instanceof ValidationError) {
		return unprocessable({ message: error.message, issues: error.issues });
	}
	return undefined;
}
