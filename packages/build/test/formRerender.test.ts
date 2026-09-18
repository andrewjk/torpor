import { expect, test } from "vite-plus/test";
import unauthorized from "../src/response/unauthorized";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { HOOK_SERVER_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";
import type PageServerAction from "../src/types/PageServerAction";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerHook from "../src/types/ServerHook";
import type ServerLoadEvent from "../src/types/ServerLoadEvent";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";
import type ManifestRoute from "../src/types/ManifestRoute";
import unprocessable from "../src/response/unprocessable";

/**
 * A query schema requiring a numeric `page` param, e.g. `?page=2`.
 */
const querySchema: StandardSchemaV1<{ page: string }, { page: number }> = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) => {
			const page = (value as { page?: unknown } | undefined)?.page;
			const n = Number(page);
			if (page === undefined || Number.isNaN(n)) {
				return { issues: [{ message: "page is required", path: ["page"] }] };
			}
			return { value: { page: n } };
		},
		types: { input: undefined as any, output: undefined as any },
	},
};

/**
 * The query values the page's load function was called with.
 */
const loadQueries: unknown[] = [];

/**
 * The action both the `default` and the named `save` action run: they
 * require a `title` field, like a form with a required input.
 */
const requireTitle: PageServerAction = async (ev) => {
	const form = await ev.form();
	if (typeof form.title !== "string") {
		return unprocessable({ message: "title is required" });
	}
	return ok();
};

/**
 * A page server endpoint whose load function requires `?page=`.
 */
const pageServer = {
	schema: {
		load: querySchema,
	},
	load: async (ev) => {
		const query = await ev.query();
		loadQueries.push(query);
		return Response.json({ query });
	},
	actions: {
		default: requireTitle,
		save: requireTitle,
	},
} satisfies PageServerEndPoint;

/**
 * A page component that renders the data it was given, so tests can check
 * what the load function passed through to the view.
 */
const component = ($props: { data: any; form: any }) => ({
	body: `<p>data=${JSON.stringify($props.data)}</p><p>form=${JSON.stringify($props.form)}</p>`,
	head: "",
});

const routes: ManifestRoute[] = [
	{
		path: "/posts",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component } }),
		subFolder: undefined,
	},
	{
		path: "/posts/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: pageServer }),
		subFolder: undefined,
	},
];

const template = "<html><head>%COMPONENT_HEAD%</head><body>%COMPONENT_BODY%</body></html>";

const load = createServerLoad(new Router().addPages(routes));

/**
 * A form post to the page's url, which drops the `?page=` param that the
 * load schema requires (as a plain form action does).
 */
function postEvent(path: string, title?: string): ServerEvent {
	const formData = new FormData();
	if (title !== undefined) formData.append("title", title);
	const req = new Request(`http://localhost${path}`, { method: "POST", body: formData });
	return new ServerEvent(req);
}

test("a default action post that keeps the load query re-renders with validated values", async () => {
	// A form without an action attribute posts to the current url, query
	// included, and the query's `page` param must not be mistaken for the
	// action name
	const res = await load(postEvent("/posts?page=3", "hello"), template);

	expect(res.status).toBe(200);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	// The load saw the query values coerced by the schema (page as a number),
	// and the form result was passed to the view
	expect(html).toContain(JSON.stringify({ query: { page: 3 } }));
	expect(html).toContain("t-form-data");
});

test("a named action post that keeps the load query re-renders with validated values", async () => {
	const res = await load(postEvent("/posts?/save&page=3", "hello"), template);

	expect(res.status).toBe(200);
	const html = await res.text();
	expect(html).toContain(JSON.stringify({ query: { page: 3 } }));
});

test("a named action post that drops the load query re-renders with the form errors", async () => {
	// A form action like `?/save` replaces the document's query, so the
	// `page` param that the load schema requires is gone from the POST url
	const res = await load(postEvent("/posts?/save"), template);

	// The form errors are rendered into the page, rather than the re-render
	// failing the load query validation (which would send the user to the
	// error page)
	expect(res.status).toBe(422);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	expect(html).toContain("t-form-data");
	expect(html).toContain("title is required");
	// The load still ran, falling back to the raw (unvalidated) query values
	expect(loadQueries.at(-1)).toEqual({ "/save": "" });
});

test("a form post that drops the load query entirely re-renders with the form errors", async () => {
	const res = await load(postEvent("/posts"), template);

	expect(res.status).toBe(422);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	expect(html).toContain("t-form-data");
	expect(html).toContain("title is required");
	// The load still ran, falling back to the raw (empty) query values
	expect(loadQueries.at(-1)).toEqual({});
});

test("a get with an invalid load query is still rejected", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);

	// The form re-render fallback must not leak into plain page loads: the
	// failed validation redirects to the error page like any other load failure
	expect(res.status).toBe(303);
	expect(res.headers.get("Location")).toContain("/_error?");
	expect(res.headers.get("Location")).toContain("status=422");
});

/**
 * A hook that authenticates the user, like a root `_hook.server.ts` setting
 * `appData.user` from the session cookie.
 */
const authHook = {
	enter: ({ appData }: { appData: Record<string, any> }) => {
		hookEnters.push(1);
		appData.user = { name: "test" };
	},
} satisfies ServerHook;

/**
 * The number of times the auth hook's enter has run. The hooks must run once
 * around a form action, and not again for the view re-render.
 */
let hookEnters: number[] = [];

/**
 * A page server endpoint whose load requires a user from `appData` (set by
 * the auth hook), and whose action fails validation.
 */
const guardedServer = {
	load: async (ev: ServerLoadEvent) => {
		if (!ev.appData.user) {
			return unauthorized();
		}
		return Response.json({ user: ev.appData.user });
	},
	actions: {
		default: async () => unprocessable({ message: "email is invalid" }),
	},
} satisfies PageServerEndPoint;

/**
 * A site with an auth hook, and a page whose load guards on the hook's
 * `appData.user`.
 */
function guardedSite() {
	hookEnters = [];
	const routes: ManifestRoute[] = [
		{
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: authHook }),
			subFolder: undefined,
		},
		{
			path: "/profile",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/profile/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: guardedServer }),
			subFolder: undefined,
		},
	];
	return createServerLoad(new Router().addPages(routes));
}

test("a load that guards on the hook's appData renders when the hook ran", async () => {
	const guardedLoad = guardedSite();
	const res = await guardedLoad(new ServerEvent(new Request("http://localhost/profile")), template);

	expect(res.status).toBe(200);
	const html = await res.text();
	expect(html).toContain(JSON.stringify({ user: { name: "test" } }));
});

test("a 4xx form action re-renders with the hook's appData instead of erroring", async () => {
	const guardedLoad = guardedSite();

	// A no-javascript form post: the action returns 422, so the view is
	// re-rendered. The re-render skips the hooks (they already ran around the
	// action), so its loads used to see an empty appData and the guarded load
	// returned a bare 401
	const res = await guardedLoad(postEvent("/profile"), template);

	expect(res.status).toBe(422);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	// The form errors were rendered into the page ...
	expect(html).toContain("t-form-data");
	expect(html).toContain("email is invalid");
	// ... and the load saw the user the hook put in appData, instead of
	// rejecting the request with 401
	expect(html).toContain(JSON.stringify({ user: { name: "test" } }));
	// The hooks ran once around the action, and not again for the re-render
	expect(hookEnters).toHaveLength(1);
});
