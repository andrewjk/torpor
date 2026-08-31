import found from "../response/found";
import ok from "../response/ok";
import type TypedResponse from "../response/TypedResponse";
import type { MergePageData, PageData } from "./PageData";
import type PageEndPoint from "./PageEndPoint";
import type PageLoadEvent from "./PageLoadEvent";
import type PageProps from "./PageProps";
import type PageServerEndPoint from "./PageServerEndPoint";

type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Post {
	title: string;
}

// A server endpoint whose load returns typed data
interface PostsServer {
	load: () => Promise<TypedResponse<{ posts: { title: string }[] }>>;
}

export const server: PostsServer = {
	load: async () => ok({ posts: [{ title: "Hello" }] }),
};

// The shape above is a valid +page.server endpoint
export const serverCompat: PageServerEndPoint<"/posts"> = server;

// PageData extracts the Jsonify'd body of the load's typed responses
export type D01 = Expect<Equals<PageData<PostsServer>, { posts: { title: string }[] }>>;

// Dates are Jsonify'd to strings through ok()
interface ClockServer {
	load: () => Promise<TypedResponse<{ now: string }>>;
}

export const clockServer: ClockServer = {
	load: async () => ok({ now: new Date() }),
};

export type D02 = Expect<Equals<PageData<ClockServer>, { now: string }>>;

// Endpoints without a load fall back to a loose record
export const actionsOnly: PageServerEndPoint<"/posts"> = {
	actions: { default: async () => ok({}) },
};
export type D03 = Expect<Equals<PageData<typeof actionsOnly>, Record<string, any>>>;

// Untyped loads (redirects etc) fall back to a loose record
export const untypedLoad: PageServerEndPoint<"/posts"> = {
	load: async () => found("/elsewhere"),
};
export type D04 = Expect<Equals<PageData<typeof untypedLoad>, Record<string, any>>>;

// The page endpoint: data keys are checked against Data
export const page: PageEndPoint<"/posts", PageData<PostsServer>> = {
	load: async () => ok({ posts: [{ title: "Hello" }] }),
};

export const badPage: PageEndPoint<"/posts", PageData<PostsServer>> = {
	// @ts-expect-error 'comments' is not part of the page's data
	load: async () => ok({ comments: [] }),
};

// Untyped responses (redirects etc) are always allowed
export const redirecting: PageEndPoint<"/posts", PageData<PostsServer>> = {
	load: async () => found("/elsewhere"),
};

// Loads with no return are allowed
export const silent: PageEndPoint<"/posts", PageData<PostsServer>> = {
	load: async () => {},
};

// Server endpoints are checked the same way
export const checkedServer: PageServerEndPoint<"/posts", { posts: Post[] }> = {
	load: async () => ok({ posts: [{ title: "Hello" }] }),
};

export const badServer: PageServerEndPoint<"/posts", { posts: Post[] }> = {
	// @ts-expect-error wrong data shape is flagged on the server endpoint too
	load: async () => ok({ posts: "not an array" }),
};

// PageProps: the shape page components receive
const props: PageProps<PageData<PostsServer>> = null as never;
export const posts: { title: string }[] = props.data.posts;
export const form: Record<string, any> | undefined = props.form;

// --- Layout data ---

// A layout endpoint with its own typed load
interface LayoutServer {
	load: () => Promise<TypedResponse<{ user: { name: string } }>>;
}

export const layoutServer: LayoutServer = {
	load: async () => ok({ user: { name: "Andrew" } }),
};

// MergePageData intersects layout and page data, in order
export type M01 = Expect<
	Equals<
		MergePageData<[typeof layoutServer, PostsServer]>,
		{ user: { name: string } } & { posts: { title: string }[] }
	>
>;

// A single endpoint merges to its own data
export type M02 = Expect<Equals<MergePageData<[PostsServer]>, { posts: { title: string }[] }>>;

// The merged shape is what the page component receives as $props.data
const mergedProps: PageProps<MergePageData<[typeof layoutServer, PostsServer]>> = null as never;
export const userName: string = mergedProps.data.user.name;
export const mergedPosts: { title: string }[] = mergedProps.data.posts;

// Endpoints without a typed load contribute only looseness
const looseProps: PageProps<MergePageData<[typeof actionsOnly, PostsServer]>> = null as never;
export const loosePosts: { title: string }[] = looseProps.data.posts;

// --- Client load events ---

// event.data is typed by the second annotation, e.g. the layout's data
export const clientLoad = (event: PageLoadEvent<"/posts", PageData<typeof layoutServer>>): void =>
	void event.data.user.name;

// 'nope' is not part of the accumulated layout data
export const badClientLoad = (
	event: PageLoadEvent<"/posts", PageData<typeof layoutServer>>,
): void =>
	// @ts-expect-error 'nope' is not part of the accumulated layout data
	void event.data.nope;

// Without a data annotation it stays loose
export const looseClientLoad = (event: PageLoadEvent<"/posts">): void => void event.data.whatever;
