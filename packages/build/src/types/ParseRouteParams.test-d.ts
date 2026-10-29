import type PageEndPoint from "./PageEndPoint";
import type PageLoadEvent from "./PageLoadEvent";
import type PageServerEndPoint from "./PageServerEndPoint";
import type { ParseRouteParams, RouteArgs, RouteParamsOf } from "./ParseRouteParams";
import type ServerEndPoint from "./ServerEndPoint";
import type ServerLoadEvent from "./ServerLoadEvent";
import route from "../nav/route";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Mutual<A, B> = A extends B ? (B extends A ? true : false) : false;
type Expect<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;

// --- ParseRouteParams ---

export type T01 = Expect<Equals<ParseRouteParams<"/about">, unknown>>;
export type T02 = Expect<Equals<ParseRouteParams<"/">, unknown>>;
export type T03 = Expect<Equals<ParseRouteParams<"/posts/[id]">, { id: string }>>;
export type T04 = Expect<
	Mutual<ParseRouteParams<"/users/[userId]/posts/[postId]">, { userId: string; postId: string }>
>;
export type T05 = Expect<Equals<ParseRouteParams<"/files/[...path]">, { path: string }>>;
export type T06 = Expect<Equals<ParseRouteParams<"/api/posts/[id]/~server">, { id: string }>>;
export type T07 = Expect<IsNever<keyof ParseRouteParams<"/about">>>;

export const postParams: ParseRouteParams<"/posts/[id]"> = { id: "5" };
export const paramValue: string = postParams.id;
// @ts-expect-error 'nope' is not a param of /posts/[id]
export const badParam: string = postParams.nope;
// @ts-expect-error 'id' is required
export const missingParam: ParseRouteParams<"/posts/[id]"> = {};

// --- RouteParamsOf (loose defaults) ---

export type T08 = Expect<Equals<RouteParamsOf<undefined>, Record<string, string>>>;
export type T09 = Expect<Equals<RouteParamsOf<string>, Record<string, string>>>;
export type T10 = Expect<Equals<RouteParamsOf<"/posts/[id]">, { id: string }>>;
// A static route has no params, so it resolves to the same loose record as an
// unannotated route -- `satisfies ServerEndPoint<"/static">` and a bare
// `satisfies ServerEndPoint` stay interchangeable (in both directions)
export type T10a = Expect<Equals<RouteParamsOf<"/about">, Record<string, string>>>;

// --- RouteArgs ---

export type T11 = Expect<Equals<RouteArgs<"/about">, []>>;
export type T12 = Expect<Equals<RouteArgs<"/posts/[id]">, [params: { id: string }]>>;

// --- Typed events ---

export const serverEvent: ServerLoadEvent<"/posts/[id]"> = null as never;
export const serverParam: string = serverEvent.params.id;
// @ts-expect-error 'nope' is not a param of /posts/[id]
export const badServerParam: string = serverEvent.params.nope;

export const pageEvent: PageLoadEvent<"/users/[userId]"> = null as never;
export const pageParam: string = pageEvent.params.userId;

// --- Usage sites ---

export const pageServer: PageServerEndPoint<"/posts/[id]"> = {
	load: (ev) => void ev.params.id,
};

// @ts-expect-error 'nope' is not a param of /posts/[id]
export const badServer: PageServerEndPoint<"/posts/[id]"> = { load: (ev) => void ev.params.nope };

export const page: PageEndPoint<"/posts/[id]"> = {
	load: (ev) => void ev.params.id,
};

// --- Interchangeable static-path annotations ---

// A helper typed with the default ServerEndPoint (no path generic), as apps
// use for shared CRUD helpers
declare function registerEndPoint(endPoint: ServerEndPoint): void;

// An endpoint annotated with a static route path
const staticAiEndPoint = {
	get: async (event) => new Response(`params: ${JSON.stringify(event.params)}`),
} satisfies ServerEndPoint<"/api/admin/ai">;

registerEndPoint(staticAiEndPoint);

// And the reverse: an unannotated endpoint used where a static path is
// expected
declare function registerStaticAi(endPoint: ServerEndPoint<"/api/admin/ai">): void;

const unannotatedEndPoint = {
	get: async (_event) => new Response("ok"),
} satisfies ServerEndPoint;

registerStaticAi(unannotatedEndPoint);

// --- Typed link builder ---

export const staticRoute: string = route("/about");
export const dynamicRoute: string = route("/posts/[id]", { id: "5" });
export const splatRoute: string = route("/files/[...path]", { path: "a/b" });
// @ts-expect-error missing params
void route("/posts/[id]");
// @ts-expect-error params are not accepted for static routes
void route("/about", {});
// @ts-expect-error 'nope' is not a param of /posts/[id]
void route("/posts/[id]", { nope: "1" });
// @ts-expect-error 'extra' is not a param of /posts/[id]
void route("/posts/[id]", { id: "5", extra: "x" });
// @ts-expect-error 'id' is required
void route("/posts/[id]", {});

// Non-literal paths fall back to a loose optional params object
export const looseRoute: string = route("/posts/[id]" as string, { id: "5" });
