import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";
import type PageServerAction from "../src/types/PageServerAction";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
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
