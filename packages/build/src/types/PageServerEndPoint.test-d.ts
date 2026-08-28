import ok from "../response/ok";
import type PageServerAction from "./PageServerAction";
import type PageServerEndPoint from "./PageServerEndPoint";
import type { PageServerActionSchemas } from "./PageServerEndPoint";
import type { FormDataRecord } from "./ServerLoadEvent";
import type { StandardSchemaV1 } from "./StandardSchema";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// A mock schema library's schema, with input and output types
declare const postSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }>;

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

// The body type inferred for a named action, from the schemas object
type ActionForm<Schemas extends PageServerActionSchemas, Name extends string> = [Name] extends [
	keyof Schemas & string,
]
	? Schemas[Name] extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<Schemas[Name]>
		: FormDataRecord
	: FormDataRecord;

// The default action's form() returns the schema's output type
export type A01 = Expect<
	Equals<ActionForm<typeof schemas, "default">, { title: string; upper: string }>
>;

// Actions without a schema keep the loose form record type
export type A02 = Expect<Equals<ActionForm<typeof schemas, "missing">, FormDataRecord>>;
export type A03 = Expect<Equals<ActionForm<PageServerActionSchemas, "default">, FormDataRecord>>;

// An untyped (annotated) action event's form() returns the loose record
const plainAction: PageServerAction<"/form"> = async ({ form }) =>
	ok({ title: (await form()).title });
type PlainForm = Awaited<ReturnType<Parameters<typeof plainAction>[0]["form"]>>;
export type A04 = Expect<Equals<PlainForm, FormDataRecord>>;

// Typed ok() bodies still flow through actions (PageForm's source)
declare const typedAction: PageServerAction<"/form", { title: string; upper: string }>;
type TypedReturn = Awaited<ReturnType<typeof typedAction>>;
export type A05 = Expect<Equals<TypedReturn, Response | undefined | void>>;

// Usage: the schema property is optional, as before
const noSchemaEndPoint: PageServerEndPoint<"/form"> = {
	actions: {
		default: async ({ form }) => ok({ title: (await form()).title }),
	},
};
export type A06 = Expect<
	Equals<typeof noSchemaEndPoint extends { schema?: unknown } ? true : false, true>
>;
