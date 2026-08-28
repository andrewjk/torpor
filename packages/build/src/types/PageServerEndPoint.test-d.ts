import ok from "../response/ok";
import type {
	ActionBody,
	LoadParams,
	LoadQuery,
	PageServerActionSchemas,
} from "./PageServerEndPoint";
import type PageServerEndPoint from "./PageServerEndPoint";
import type { StandardSchemaV1 } from "./StandardSchema";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// A mock schema library's schema, with input and output types
declare const postSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }>;
declare const querySchema: StandardSchemaV1<{ page: string }, { page: number }>;
declare const paramsSchema: StandardSchemaV1<{ id: string }, { id: number }>;

const schemas: { default: typeof postSchema } = { default: postSchema };

// An endpoint declaring a schema for its default action. The `.upper` access
// below compiles only when form() is contextually typed from the schema's
// output, since actions map their body to their schema's key
export const endPoint: PageServerEndPoint<"/form", Record<string, any>, typeof schemas> = {
	schema: schemas,
	actions: {
		default: async ({ form }) => ok({ title: (await form()).upper }),
	},
};

// The type helpers behind the load/action signatures
export type A01 = Expect<
	Equals<ActionBody<typeof schemas, "default">, { title: string; upper: string }>
>;
export type A02 = Expect<
	Equals<
		ActionBody<typeof schemas, "missing">,
		Record<string, FormDataEntryValue | FormDataEntryValue[]>
	>
>;
export type A03 = Expect<
	Equals<
		ActionBody<PageServerActionSchemas, "default">,
		Record<string, FormDataEntryValue | FormDataEntryValue[]>
	>
>;

// The load function's schema (the `load` key) types the query string
const querySchemas: { load: typeof querySchema } = { load: querySchema };
export type A04 = Expect<Equals<LoadQuery<typeof querySchemas>, { page: number }>>;
export type A05 = Expect<
	Equals<LoadQuery<PageServerActionSchemas>, Record<string, string | string[]>>
>;

// The `params` key types the params of the load function and actions
const paramSchemas: { params: typeof paramsSchema } = { params: paramsSchema };
export type A06 = Expect<Equals<LoadParams<typeof paramSchemas, "/posts/[id]">, { id: number }>>;
export type A07 = Expect<
	Equals<LoadParams<PageServerActionSchemas, "/posts/[id]">, { id: string }>
>;

// An endpoint using all of them: the `page` access below compiles only when
// the load's query is typed from its schema
export const fullEndPoint: PageServerEndPoint<
	"/posts/[id]",
	Record<string, any>,
	{ params: typeof paramsSchema; load: typeof querySchema; default: typeof postSchema }
> = {
	schema: {
		params: paramsSchema,
		load: querySchema,
		default: postSchema,
	},
	load: async ({ params, query }) => ok({ id: params.id, page: (await query()).page }),
	actions: {
		default: async ({ params, form }) => ok({ id: params.id, title: (await form()).upper }),
	},
};

// An untyped action keeps the loose form record and string params
type PlainAction = NonNullable<NonNullable<typeof plainEndPoint.actions>["default"]>;
const plainEndPoint: PageServerEndPoint<"/form"> = {
	actions: {
		default: async ({ form }) => ok({ title: (await form()).title }),
	},
};
type PlainEvent = Parameters<PlainAction>[0];
export type A08 = Expect<
	Equals<
		Awaited<ReturnType<PlainEvent["form"]>>,
		Record<string, FormDataEntryValue | FormDataEntryValue[]>
	>
>;

// Typed ok() bodies still flow through actions (PageForm's source)
type DefaultReturn = Awaited<
	ReturnType<NonNullable<NonNullable<typeof endPoint.actions>["default"]>>
>;
export type A09 = Expect<Equals<DefaultReturn, Response | undefined | void>>;

// The schema property is optional, as before
export type A10 = Expect<
	Equals<PageServerEndPoint extends { schema?: unknown } ? true : false, true>
>;
