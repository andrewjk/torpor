import type { ApiMethods } from "./api";
import makeApi from "./api";
import ok from "../response/ok";
import type TypedResponse from "../response/TypedResponse";
import type ServerLoadEvent from "../types/ServerLoadEvent";

// A sample endpoint shape, as inferred from a `+server` default export
interface TimeEndPoint {
	get: (event: ServerLoadEvent<"/api/time">) => Promise<TypedResponse<{ time: number }>>;
	post: (event: ServerLoadEvent<"/api/time">) => Promise<Response>;
}

// An endpoint whose handler annotates an expected request body
interface CreatePostEndPoint {
	post: (
		event: ServerLoadEvent<"/api/posts", { title: string }>,
	) => Promise<TypedResponse<{ id: number }>>;
}

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// The get caller resolves to the typed JSON body (or a raw Response)
export type R01 = Expect<
	Equals<
		ApiMethods<TimeEndPoint>["get"],
		(body?: BodyInit | object, init?: RequestInit) => Promise<{ time: number } | Response>
	>
>;

// Handlers that return a plain Response fall back to unknown
export type R02 = Expect<
	Equals<
		ApiMethods<TimeEndPoint>["post"],
		(body?: BodyInit | object, init?: RequestInit) => Promise<unknown>
	>
>;

// Only defined handlers are callable
export type R03 = Expect<Equals<keyof ApiMethods<TimeEndPoint>, "get" | "post">>;

// An annotated event body types the client call's body param
export type R04 = Expect<
	Equals<
		ApiMethods<CreatePostEndPoint>["post"],
		(
			body?: { title: string },
			init?: RequestInit,
		) => Promise<{ id: number } | Response>
	>
>;

// Usage: params are enforced by the route path
export const timeApi: ApiMethods<TimeEndPoint> = makeApi<"/api/time", TimeEndPoint>("/api/time");
export const postApi: ApiMethods<TimeEndPoint> = makeApi<"/api/posts/[id]", TimeEndPoint>(
	"/api/posts/[id]",
	{
		id: "5",
	},
);
// @ts-expect-error missing params
void makeApi<"/api/posts/[id]", TimeEndPoint>("/api/posts/[id]");
// @ts-expect-error params are not accepted for static paths
void makeApi<"/api/time", TimeEndPoint>("/api/time", {});
// @ts-expect-error 'nope' is not a param of /api/posts/[id]
void makeApi<"/api/posts/[id]", TimeEndPoint>("/api/posts/[id]", { nope: "1" });

// Usage: an annotated body is checked at the call site
export const createApi: ApiMethods<CreatePostEndPoint> = makeApi<"/api/posts", CreatePostEndPoint>(
	"/api/posts",
);
void createApi.post({ title: "Hello" });
// @ts-expect-error 'name' is not part of the endpoint's expected body
void createApi.post({ name: "Hello" });
// @ts-expect-error 'title' is required
void createApi.post({});

// ok() typing: object bodies are typed, strings are not
export const typed: TypedResponse<{ time: number }> = ok({ time: 5 });
export const untypedResponse: Response = ok("plain");
export const noBodyResponse: Response = ok();
