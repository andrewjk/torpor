import type PageServerAction from "./PageServerAction";
import type PageServerLoad from "./PageServerLoad";
import type { FormDataRecord } from "./ServerLoadEvent";
import type { StandardSchemaV1 } from "./StandardSchema";

/**
 * Optional standard schemas for validating action form data, keyed by the
 * action name they apply to. Any schema implementing the Standard Schema
 * interface (zod, valibot, arktype, etc) can be used.
 *
 * When a submitted form fails validation, the action is not called and a 422
 * response with the schema's issues is returned, which becomes the page's
 * `$props.form`. When it passes, `event.form()` returns the parsed values.
 */
export type PageServerActionSchemas = {
	[action: string]: StandardSchemaV1 | undefined;
};

/**
 * The form values type for an action, inferred from its schema. Falls back
 * to a loose record for actions without a declared schema.
 */
type ActionBody<Schemas extends PageServerActionSchemas, Name extends string> = [Name] extends [
	keyof Schemas & string,
]
	? Schemas[Name] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Name]>
		: FormDataRecord
	: FormDataRecord;

/**
 * For +page.server. Annotate with a route path to get typed params, and with
 * a data shape to flag loads that return keys the page doesn't expect, e.g.
 * `PageServerEndPoint<"/posts/[id]", { posts: Post[] }>`. Annotate with a
 * schemas object to get typed (and validated) form values in actions, e.g.
 * `PageServerEndPoint<"/posts", Record<string, any>, typeof schema>`.
 */
export default interface PageServerEndPoint<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
	Schemas extends PageServerActionSchemas = PageServerActionSchemas,
> {
	/**
	 * Loads data from the server for a page.
	 */
	load?: PageServerLoad<Route, Data>;
	/**
	 * A map of actions that can be performed on the server for a page, generally from a form submit.
	 */
	actions?: { [Name in string]: PageServerAction<Route, ActionBody<Schemas, Name>> };
	/**
	 * Optional standard schemas for validating action form data, keyed by
	 * action name, e.g.
	 *
	 * ```ts
	 * const schema = { default: z.object({ title: z.string() }) };
	 * export default {
	 *   schema,
	 *   actions: {
	 *     default: async ({ form }) => ok((await form()).title),
	 *   },
	 * } satisfies PageServerEndPoint<"/posts", Record<string, any>, typeof schema>;
	 * ```
	 */
	schema?: Schemas | undefined;
}
