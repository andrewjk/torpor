import type { RouteParamsOf } from "./ParseRouteParams";
import type PageServerAction from "./PageServerAction";
import type PageServerLoad from "./PageServerLoad";
import type { FormDataRecord, QueryRecord } from "./ServerLoadEvent";
import type { StandardSchemaV1 } from "./StandardSchema";

/**
 * Optional standard schemas for +page.server endpoints, keyed by name. Any
 * schema implementing the Standard Schema interface (zod, valibot, arktype,
 * etc) can be used.
 *
 * - action name schemas validate the submitted form data, surfaced through
 *   `event.form()` in the action
 * - the `load` key validates the URL's query string, surfaced through
 *   `event.query()` in the load function
 * - a `params` key validates (and generally coerces) the route params,
 *   surfaced through `event.params` in the load function and actions
 *
 * When a submitted form or query string fails validation, the action or load
 * function is not called and a 422 response with the schema's issues is
 * returned (which becomes the page's `$props.form` for actions). When route
 * params fail validation, a 404 response is returned, since the URL can't
 * refer to an existing resource.
 */
export type PageServerActionSchemas = {
	params?: StandardSchemaV1;
	load?: StandardSchemaV1;
	[action: string]: StandardSchemaV1 | undefined;
};

/**
 * The form values type for an action, inferred from its schema. Falls back
 * to a loose record for actions without a declared schema.
 */
export type ActionBody<Schemas extends PageServerActionSchemas, Name extends string> = [
	Name,
] extends [keyof Schemas & string]
	? Schemas[Name] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Name]>
		: FormDataRecord
	: FormDataRecord;

/**
 * The query type for the load function, inferred from its schema.
 */
export type LoadQuery<Schemas extends PageServerActionSchemas> = Schemas extends {
	load: StandardSchemaV1;
}
	? StandardSchemaV1.InferOutput<Schemas["load"]>
	: QueryRecord;

/**
 * The route params type, inferred from the `params` schema.
 */
export type LoadParams<
	Schemas extends PageServerActionSchemas,
	Route extends string | undefined,
> = Schemas extends { params: StandardSchemaV1 }
	? StandardSchemaV1.InferOutput<Schemas["params"]>
	: RouteParamsOf<Route>;

/**
 * For +page.server. Annotate with a route path to get typed params, and with
 * a data shape to flag loads that return keys the page doesn't expect, e.g.
 * `PageServerEndPoint<"/posts/[id]", { posts: Post[] }>`. Annotate with a
 * schemas object to get typed (and validated) form values, query strings and
 * params, e.g. `PageServerEndPoint<"/posts", Record<string, any>, typeof schema>`.
 */
export default interface PageServerEndPoint<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
	Schemas extends PageServerActionSchemas = PageServerActionSchemas,
> {
	/**
	 * Loads data from the server for a page. Its schema (the `load` key)
	 * validates the URL's query string.
	 */
	load?: PageServerLoad<Route, Data, LoadQuery<Schemas>, LoadParams<Schemas, Route>>;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: {
		[Name in string]: PageServerAction<
			Route,
			ActionBody<Schemas, Name>,
			LoadParams<Schemas, Route>
		>;
	};
	/**
	 * Optional standard schemas for validating requests, keyed by action name
	 * (plus `load` for the query string and `params` for the route params),
	 * e.g.
	 *
	 * ```ts
	 * const schema = {
	 *   params: z.object({ id: z.coerce.number() }),
	 *   load: z.object({ page: z.coerce.number() }),
	 *   default: z.object({ title: z.string() }),
	 * };
	 * export default {
	 *   schema,
	 *   load: async ({ query }) => ok(await query()),
	 *   actions: {
	 *     default: async ({ form }) => ok((await form()).title),
	 *   },
	 * } satisfies PageServerEndPoint<"/posts/[id]", Record<string, any>, typeof schema>;
	 * ```
	 */
	schema?: Schemas | undefined;
}
