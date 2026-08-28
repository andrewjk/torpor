import type { ApiMethods } from "../nav/api";
import ok from "../response/ok";
import type ServerEndPoint from "./ServerEndPoint";
import type { StandardSchemaV1 } from "./StandardSchema";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// A mock schema library's schema, with input and output types
declare const postSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }>;
declare const getSchema: StandardSchemaV1<unknown, { query: string }>;

const schemas: { post: typeof postSchema } = { post: postSchema };

// An endpoint declaring a schema for its post handler. The `.upper` access
// below compiles only when json() is typed from the schema's output
const endpoint: ServerEndPoint<"/api/posts", typeof schemas> = {
	schema: schemas,
	post: async ({ json }) => ok({ echoed: (await json()).upper }),
};

// json() returns the schema's output type
type PostEvent = Parameters<NonNullable<typeof endpoint.post>>[0];
export type R01 = Expect<
	Equals<Awaited<ReturnType<PostEvent["json"]>>, { title: string; upper: string }>
>;

// The schema's input type is available via InferInput
export type R02 = Expect<Equals<StandardSchemaV1.InferInput<typeof postSchema>, { title: string }>>;

// Client callers made with makeApi accept the schema's output as their body
type PostEndPoint = ServerEndPoint<"/api/posts", typeof schemas>;
export type R03 = Expect<
	Equals<
		Parameters<ApiMethods<PostEndPoint>["post"]>[0],
		{ title: string; upper: string } | undefined
	>
>;

// Endpoints without schemas keep the loose unknown body type
const plainEndpoint: ServerEndPoint<"/api/posts"> = {
	post: async ({ json }) => ok({ v: await json() }),
};
type PlainEvent = Parameters<NonNullable<typeof plainEndpoint.post>>[0];
export type R04 = Expect<Equals<Awaited<ReturnType<PlainEvent["json"]>>, unknown>>;

// A schema declared for one method doesn't leak into another
const getSchemas: { get: typeof getSchema } = { get: getSchema };
const getEndpoint: ServerEndPoint<"/api/posts", typeof getSchemas> = {
	schema: getSchemas,
	post: async ({ json }) => ok({ v: await json() }),
};
type GetEndpointPostEvent = Parameters<NonNullable<typeof getEndpoint.post>>[0];
export type R05 = Expect<Equals<Awaited<ReturnType<GetEndpointPostEvent["json"]>>, unknown>>;

// The schema property is optional, as before
const noSchemaEndpoint: ServerEndPoint<"/api/time"> = {
	get: async () => ok({ time: Date.now() }),
};
export type R06 = Expect<
	Equals<typeof noSchemaEndpoint extends { schema?: unknown } ? true : false, true>
>;
