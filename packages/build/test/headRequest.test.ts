import { expect, test } from "vite-plus/test";
import { DATA_REQUEST_HEADER } from "../src/dataRequest";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";

const template = "<html><head></head><body>%COMPONENT_BODY%</body></html>";

function site(api: Record<string, unknown>): ReturnType<typeof createServerLoad> {
	const routes: ManifestRoute[] = [
		{
			path: "/page",
			type: PAGE_ROUTE,
			endPoint: () =>
				Promise.resolve({
					default: { component: ($props: any) => ({ body: `<p>${$props.data.n}</p>`, head: "" }) },
				}),
			subFolder: undefined,
		},
		{
			path: "/page/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { load: async () => ok({ n: 1 }) } }),
			subFolder: undefined,
		},
		{
			path: "/api",
			type: SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: api }),
			subFolder: undefined,
		},
	];
	return createServerLoad(new Router().addPages(routes));
}

function request(method: string, path: string, headers: Record<string, string> = {}): ServerEvent {
	return new ServerEvent(new Request(`http://localhost${path}`, { method, headers }));
}

test("a HEAD request for a page gets the GET response's status and headers, with no body", async () => {
	const load = site({});
	const get = await load(request("GET", "/page"), template);
	const head = await load(request("HEAD", "/page"), template);

	expect(get.status).toBe(200);
	expect(head.status).toBe(200);
	expect(head.headers.get("Content-Type")).toBe(get.headers.get("Content-Type"));
	expect(head.headers.get("ETag")).toBe(get.headers.get("ETag"));
	expect(await head.text()).toBe("");
});

test("a HEAD request with a matching ETag gets a 304", async () => {
	const load = site({});
	const etag = (await load(request("GET", "/page"), template)).headers.get("ETag")!;
	const head = await load(request("HEAD", "/page", { "If-None-Match": etag }), template);
	expect(head.status).toBe(304);
});

test("a HEAD data request gets the data response's headers", async () => {
	const load = site({});
	const head = await load(
		request("HEAD", "/page/~server", { [DATA_REQUEST_HEADER]: "1" }),
		template,
	);
	expect(head.status).toBe(200);
	expect(head.headers.get("Content-Type")).toContain("json");
	expect(await head.text()).toBe("");
});

test("a HEAD request for an endpoint without a head handler runs get", async () => {
	const load = site({ get: () => ok({ hello: "world" }) });
	const head = await load(request("HEAD", "/api"), template);
	expect(head.status).toBe(200);
	expect(await head.text()).toBe("");
});

test("an endpoint's own head handler still wins", async () => {
	let ran = "";
	const load = site({
		get: () => {
			ran = "get";
			return ok({});
		},
		head: () => {
			ran = "head";
			return new Response(null, { status: 204 });
		},
	});
	const head = await load(request("HEAD", "/api"), template);
	expect(ran).toBe("head");
	expect(head.status).toBe(204);
});

test("a HEAD request for an endpoint with neither handler is a 404", async () => {
	const load = site({ post: () => ok({}) });
	const head = await load(request("HEAD", "/api"), template);
	expect(head.status).toBe(404);
});
