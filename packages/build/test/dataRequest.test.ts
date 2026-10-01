import { beforeEach, expect, test } from "vite-plus/test";
import { DATA_REUSE_HEADER, DATA_REQUEST_HEADER } from "../src/dataRequest";
import seeOther from "../src/response/seeOther";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerHook from "../src/types/ServerHook";
import {
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
} from "../src/types/RouteType";

const hookCalls: string[] = [];

const rootHook: ServerHook = {
	enter: (ev) => {
		hookCalls.push(ev.url.pathname);
		ev.appData.user = "alice";
	},
};

const layoutServer = {
	load: async (ev) => Response.json({ layout: true, user: ev.appData.user }),
} satisfies PageServerEndPoint;

const pageServer = {
	load: async (ev) => Response.json({ page: true, user: ev.appData.user }),
} satisfies PageServerEndPoint;

const component = () => ({ body: "", head: "" });

/**
 * A page with a root layout (both with server loads) and a root hook. The
 * page itself may or may not have a `+page.server.ts`, so `withPageServer`
 * controls whether the `/{page}/~server` route exists.
 */
function siteRoutes(withPageServer: boolean): ManifestRoute[] {
	const routes: ManifestRoute[] = [
		{
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: rootHook }),
			subFolder: undefined,
		},
		{
			path: "/_layout",
			type: LAYOUT_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/_layout/~server",
			type: LAYOUT_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: layoutServer }),
			subFolder: undefined,
		},
		{
			path: "/dashboard",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
	];
	if (withPageServer) {
		routes.push({
			path: "/dashboard/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: pageServer }),
			subFolder: undefined,
		});
	}
	return routes;
}

function dataEvent(path: string): ServerEvent {
	const req = new Request(`http://localhost${path}`, {
		headers: { [DATA_REQUEST_HEADER]: "1" },
	});
	return new ServerEvent(req);
}

beforeEach(() => {
	hookCalls.length = 0;
});

test("a data request returns layout and page server data, with hooks run once", async () => {
	const load = createServerLoad(new Router().addPages(siteRoutes(true)));

	const res = await load(dataEvent("/dashboard/~server"), "%COMPONENT_BODY%");

	expect(res.status).toBe(200);
	expect(res.headers.get("Content-Type")).toContain("application/json");
	// One entry per layout, then the page
	expect(await res.json()).toEqual({
		loads: [
			{ layout: true, user: "alice" },
			{ page: true, user: "alice" },
		],
	});
	// The hook saw the page url, not the internal `~server` url
	expect(hookCalls).toEqual(["/dashboard"]);
});

test("a data request works for a page with no +page.server", async () => {
	const load = createServerLoad(new Router().addPages(siteRoutes(false)));

	const res = await load(dataEvent("/dashboard/~server"), "%COMPONENT_BODY%");

	expect(res.status).toBe(200);
	// The page has no server load, so its slot is null
	expect(await res.json()).toEqual({
		loads: [{ layout: true, user: "alice" }, null],
	});
});

test("a reused layout's server load is skipped", async () => {
	const layoutCalls: number[] = [];
	const routes = siteRoutes(true);
	routes[2].endPoint = () =>
		Promise.resolve({
			default: {
				load: async () => {
					layoutCalls.push(1);
					return Response.json({ layout: true });
				},
			},
		});
	const load = createServerLoad(new Router().addPages(routes));

	const req = new Request("http://localhost/dashboard/~server", {
		headers: {
			[DATA_REQUEST_HEADER]: "1",
			[DATA_REUSE_HEADER]: JSON.stringify(["/_layout"]),
		},
	});
	const res = await load(new ServerEvent(req), "%COMPONENT_BODY%");

	// The reused layout's slot is null and its load never ran
	expect(await res.json()).toEqual({ loads: [null, { page: true, user: "alice" }] });
	expect(layoutCalls).toEqual([]);
});

test("a hook redirect short-circuits a data request", async () => {
	const routes = siteRoutes(true);
	const redirectingHook: ServerHook = { enter: () => seeOther("/login") };
	routes[0].endPoint = () => Promise.resolve({ default: redirectingHook });
	const load = createServerLoad(new Router().addPages(routes));

	const res = await load(dataEvent("/dashboard/~server"), "%COMPONENT_BODY%");

	expect(res.status).toBe(303);
	expect(res.headers.get("Location")).toBe("/login");
});

test("route middleware runs around a data request", async () => {
	const calls: string[] = [];
	const routes = siteRoutes(true);
	const pageServerWithMiddleware = {
		load: async () => {
			calls.push("load");
			return Response.json({ page: true });
		},
		middleware: [
			{
				enter: () => {
					calls.push("enter");
				},
				exit: () => {
					calls.push("exit");
				},
			},
		],
	} satisfies PageServerEndPoint;
	routes[routes.length - 1].endPoint = () => Promise.resolve({ default: pageServerWithMiddleware });
	const load = createServerLoad(new Router().addPages(routes));

	const res = await load(dataEvent("/dashboard/~server"), "%COMPONENT_BODY%");

	expect(res.status).toBe(200);
	expect(calls).toEqual(["enter", "load", "exit"]);
});

test("a plain ~server request (no data header) is unchanged", async () => {
	const load = createServerLoad(new Router().addPages(siteRoutes(true)));

	const req = new Request("http://localhost/dashboard/~server");
	const res = await load(new ServerEvent(req), "%COMPONENT_BODY%");

	expect(res.status).toBe(200);
	// The page's own server load response, not the combined data payload
	expect(await res.json()).toEqual({ page: true, user: "alice" });
});
