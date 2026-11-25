import { expect, test } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { ERROR_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";
import seeOther from "../src/response/seeOther";
import notFound from "../src/response/notFound";
import ok from "../src/response/ok";

/**
 * A page component that renders its data and links to other routes, so the
 * tests can check that hrefs got the base path added.
 */
const component = ($props: { data: any }) => ({
	body: `<a href="/posts">all posts</a><p>path=${$props.data?.path}</p>`,
	head: "",
});

/**
 * An error page component, so the tests can check that the error page got
 * rendered (rather than the raw not-found body).
 */
const errorComponent = () => ({
	body: `<p>error page</p>`,
	head: "",
});

const pageServer = {
	load: async (ev: { url: URL }) => ok({ path: ev.url.pathname }),
};

/** A +server endpoint: POST redirects to a base-free path. */
const apiEndPoint = {
	get: async () => notFound(),
	post: async () => seeOther("/done"),
};

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
	{
		path: "/api",
		type: SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: apiEndPoint }),
		subFolder: undefined,
	},
	{
		path: "/_error",
		type: ERROR_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: errorComponent } }),
		subFolder: undefined,
	},
];

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

const load = createServerLoad(new Router().addPages(routes), "/app");

/** Runs the response through the same finalization Server.fetch does */
async function handle(ev: ServerEvent): Promise<Response> {
	ev.response = await load(ev, template);
	ev.response ??= new Response(null, { status: 200 });
	ev.addHeaders();
	return ev.response;
}

test("requests under the base path route to the base-free routes", async () => {
	const res = await handle(new ServerEvent(new Request("http://localhost/app/posts?page=3")));

	expect(res.status).toBe(200);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	// The load function saw the url without the base path
	expect(html).toContain("path=/posts");
	// The href attributes got the base path added
	expect(html).toContain('href="/app/posts"');
});

test("two sites with different base paths don't share module state", async () => {
	// Both handlers are created before either request runs: with a module
	// global, creating the second site would overwrite the first one's base
	const siteA = createServerLoad(new Router().addPages(routes), "/app");
	const siteB = createServerLoad(new Router().addPages(routes), "/sub");

	const run = async (loadSite: typeof load, path: string, method = "GET") => {
		const ev = new ServerEvent(new Request(path, { method }));
		ev.response = await loadSite(ev, template);
		ev.response ??= new Response(null, { status: 200 });
		ev.addHeaders();
		return ev.response;
	};

	const [a, b] = await Promise.all([
		run(siteA, "http://localhost/app/posts"),
		run(siteB, "http://localhost/sub/posts"),
	]);
	expect(await a.text()).toContain('href="/app/posts"');
	expect(await b.text()).toContain('href="/sub/posts"');

	// Response finalization (redirect locations) also uses the request's site
	const redirect = await run(siteA, "http://localhost/app/api", "POST");
	expect(redirect.headers.get("Location")).toBe("/app/done");
});

test("requests without the base path get the error page at the requested url", async () => {
	// A request not under the mount point can't be routed; like any error it
	// renders the site's error page, but at the requested url and with the
	// not-found status rather than a redirect
	const res = await handle(new ServerEvent(new Request("http://localhost/posts")));
	expect(res.status).toBe(404);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	expect(html).toContain("error page");
	expect(res.headers.get("Location")).toBeNull();
});

test("redirect locations for base-free paths get the base added", async () => {
	const res = await handle(
		new ServerEvent(new Request("http://localhost/app/api", { method: "POST" })),
	);
	expect(res.status).toBe(303);
	expect(res.headers.get("Location")).toBe("/app/done");
});
