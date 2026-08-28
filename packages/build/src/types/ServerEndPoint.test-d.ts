import ok from "../response/ok";
import type { ParamsOf, SchemaBody, SchemaQuery } from "./ServerEndPoint";
import type ServerEndPoint from "./ServerEndPoint";
import type { StandardSchemaV1 } from "./StandardSchema";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// A mock schema library's schema, with input and output types
declare const postSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }>;
declare const querySchema: StandardSchemaV1<{ page: string }, { page: number }>;
declare const paramsSchema: StandardSchemaV1<{ id: string }, { id: number }>;

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
	Equals<Parameters<Api<PostEndPoint>["post"]>[0], { title: string; upper: string } | undefined>
>;
type Api<E extends object> = import("../nav/api").ApiMethods<E>;

// The type helpers behind the handler signatures
export type R04 = Expect<
	Equals<SchemaBody<typeof schemas, "post">, { title: string; upper: string }>
>;
export type R05 = Expect<
	Equals<SchemaQuery<typeof schemas, "get">, Record<string, string | string[]>>
>;

// A get handler's schema types the query string instead of the body
const getEndpoint: ServerEndPoint<"/api/posts", { get: typeof querySchema }> = {
	schema: { get: querySchema },
	get: async ({ query }) => ok({ page: (await query()).page }),
};
type GetEvent = Parameters<NonNullable<typeof getEndpoint.get>>[0];
export type R06 = Expect<Equals<Awaited<ReturnType<GetEvent["query"]>>, { page: number }>>;
export type R07 = Expect<Equals<Awaited<ReturnType<GetEvent["json"]>>, unknown>>;

// A params schema types (and coerces) the event's params
const paramsEndpoint: ServerEndPoint<"/api/posts/[id]", { params: typeof paramsSchema }> = {
	schema: { params: paramsSchema },
	get: async ({ params }) => ok({ id: params.id }),
};
type ParamsEvent = Parameters<NonNullable<typeof paramsEndpoint.get>>[0];
export type R08 = Expect<Equals<ParamsEvent["params"], { id: number }>>;

// Endpoints without schemas keep the loose types
const plainEndpoint: ServerEndPoint<"/api/posts"> = {
	post: async ({ json }) => ok({ v: await json() }),
};
type PlainEvent = Parameters<NonNullable<typeof plainEndpoint.post>>[0];
export type R09 = Expect<Equals<Awaited<ReturnType<PlainEvent["json"]>>, unknown>>;

// The params of a route without a params schema are string record of the
// route's dynamic segments
export type R10 = Expect<
	Equals<ParamsOf<ServerEndPointSchemas, "/api/posts/[id]">, { id: string }>
>;
type ServerEndPointSchemas = import("./ServerEndPoint").ServerEndPointSchemas;
