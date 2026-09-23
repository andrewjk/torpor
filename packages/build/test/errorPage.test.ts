import { expect, test } from "vite-plus/test";
import notFound from "../src/response/notFound";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import $page from "../src/state/$serverPage";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerEndPoint from "../src/types/ServerEndPoint";
import { ERROR_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";

/**
 * The root error page, rendering the $page state that was set for it, so
 * the tests can check the status, message and url it was rendered with.
 */
const errorComponent = () => ({
	body:
		`<p>error status=${$page.status}</p>` +
		`<p>error message=${$page.error?.message}</p>` +
		`<p>error url=${$page.url.pathname}</p>`,
	head: "",
});

/**
 * An error page registered under /admin, which should win over the root
 * error page for urls below /admin.
 */
const adminErrorComponent = () => ({
	body: `<p>admin error page</p>`,
	head: "",
});

/**
 * A page component, which also renders $page's error message so the tests
 * can check that it was reset after an error.
 */
const pageComponent = ($props: { data: any }) => ({
	body:
		`<p>page data=${JSON.stringify($props.data)}</p>` +
		`<p>page errmsg=${$page.error?.message}</p>`,
	head: "",
});

const postsServer: PageServerEndPoint = {
	load: async () => notFound("post not found"),
};

const jsonServer: PageServerEndPoint = {
	load: async () => notFound({ message: "json message" }),
};

const boomServer: PageServerEndPoint = {
	load: async () => {
		throw new Error("load boom");
	},
};

const okServer: PageServerEndPoint = {
	load: async () => ok({ hello: "world" }),
};

const apiEndPoint: ServerEndPoint = {
	get: async () => {
		throw new Error("api boom");
	},
};

const routes: ManifestRoute[] = [
	{
		path: "/",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
	{
		path: "/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: okServer }),
		subFolder: undefined,
	},
	{
		path: "/posts",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
	{
		path: "/posts/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: postsServer }),
		subFolder: undefined,
	},
	{
		path: "/json",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
	{
		path: "/json/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: jsonServer }),
		subFolder: undefined,
	},
	{
		path: "/boom",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
	{
		path: "/boom/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: boomServer }),
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
	{
		path: "/admin/_error",
		type: ERROR_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: adminErrorComponent } }),
		subFolder: undefined,
	},
];

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

const load = createServerLoad(new Router().addPages(routes));

test("a failed load renders the error page at the requested url", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);

	expect(res.status).toBe(404);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	// No redirect: the url in the address bar stays the requested one
	expect(res.headers.get("Location")).toBeNull();

	const html = await res.text();
	expect(html).toContain("error status=404");
	expect(html).toContain("error message=post not found");
	// The error page saw the requested url, so it can show it
	expect(html).toContain("error url=/posts");
});

test("an unmatched route renders the error page at the requested url", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/nope")), template);

	expect(res.status).toBe(404);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	expect(html).toContain("error status=404");
	expect(html).toContain("error message=Not found");
	expect(html).toContain("error url=/nope");
});

test("the message is extracted from a json error body", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/json")), template);

	expect(res.status).toBe(404);
	const html = await res.text();
	expect(html).toContain("error message=json message");
});

test("a thrown exception renders a 500 error page at the requested url", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/boom")), template);

	expect(res.status).toBe(500);
	expect(res.headers.get("Content-Type")).toContain("text/html");
	const html = await res.text();
	expect(html).toContain("error status=500");
	expect(html).toContain("error message=load boom");
	expect(html).toContain("error url=/boom");
});

test("a thrown exception from an api endpoint is not turned into a page", async () => {
	// Api endpoints are json in, json out: the error is rethrown for the
	// server adapters rather than rendered as html
	await expect(
		load(new ServerEvent(new Request("http://localhost/api")), template),
	).rejects.toThrow("api boom");
});

test("the nearest error route wins", async () => {
	const res = await load(new ServerEvent(new Request("http://localhost/admin/nope")), template);
	expect(res.status).toBe(404);
	expect(await res.text()).toContain("admin error page");

	const rootRes = await load(new ServerEvent(new Request("http://localhost/nope")), template);
	expect(rootRes.status).toBe(404);
	expect(await rootRes.text()).toContain("error status=404");
});

test("the error page responds with its status when requested directly", async () => {
	const res = await load(
		new ServerEvent(new Request("http://localhost/_error?status=404&message=nope")),
		template,
	);
	expect(res.status).toBe(404);
	expect(await res.text()).toContain("error message=nope");

	// Without a status in the query, it defaults to 404
	const bare = await load(new ServerEvent(new Request("http://localhost/_error")), template);
	expect(bare.status).toBe(404);
});

test("the error state is reset between requests", async () => {
	const errorRes = await load(new ServerEvent(new Request("http://localhost/posts")), template);
	expect(await errorRes.text()).toContain("error message=post not found");

	const okRes = await load(new ServerEvent(new Request("http://localhost/")), template);
	expect(okRes.status).toBe(200);
	const html = await okRes.text();
	expect(html).toContain("page errmsg=");
});
