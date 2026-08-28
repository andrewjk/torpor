import CookieHelper from "../server/CookieHelper";
import HeaderHelper from "../server/HeaderHelper";
import type { RouteParamsOf } from "./ParseRouteParams";

/**
 * The values read from a form submission: one value per field, or an array
 * when a field was submitted with multiple values (e.g. a multi select).
 */
export type FormDataRecord = Record<string, FormDataEntryValue | FormDataEntryValue[]>;

/**
 * The event passed to server functions. Annotate with a route path to get
 * typed params, e.g. `ServerLoadEvent<"/posts/[id]">`, and with a body type
 * to get typed request bodies in API endpoints, e.g.
 * `ServerLoadEvent<"/api/posts", { title: string }>` — which also types the
 * `body` param of client calls made with `makeApi`.
 */
export default interface ServerLoadEvent<
	Route extends string | undefined = undefined,
	Body = unknown,
	FormBody = FormDataRecord,
> {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: RouteParamsOf<Route>;
	// TODO: Maybe we should find a better name for the data that is set set in
	// pages, and just call this data?
	/**
	 * Data that is available to functions in +server hooks, layouts, endpoints
	 * and pages. It flows down in that order.
	 */
	appData: Record<string, any>;
	/**
	 * The server request.
	 */
	request: Request;
	//response: ServerResponse;
	/**
	 * Reads the request body as JSON, typed by the event's `Body` annotation.
	 */
	json: () => Promise<Body>;
	/**
	 * Reads the request body as form data, returning a record of field values.
	 * When the endpoint declares a schema for the form, the values are
	 * validated and typed by the schema's output.
	 */
	form: () => Promise<FormBody>;
	/**
	 * A helper for getting and setting cookie data.
	 */
	cookies: CookieHelper;
	/**
	 * A helper for getting and setting headers.
	 */
	headers: HeaderHelper;
	/**
	 * An optional adapter object, containing adapter-specific functionality.
	 */
	adapter: Record<PropertyKey, any>;
}
