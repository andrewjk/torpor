import { describe, expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";
import type MiddlewareFunction from "../src/server/types/MiddlewareFunction";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerEndPoint from "../src/types/ServerEndPoint";

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

const component = () => ({ body: `<p>the page</p>`, head: "" });

const pageServer: PageServerEndPoint = {
	load: async () => ok({ ok: true }),
};

const apiEndPoint: ServerEndPoint = {
	get: async () => new Response("api"),
};

function routes(middleware?: MiddlewareFunction[]): ManifestRoute[] {
	return [
		{
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/posts/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { ...pageServer, middleware } }),
			subFolder: undefined,
		},
		{
			path: "/api",
			type: SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { ...apiEndPoint, middleware } }),
			subFolder: undefined,
		},
	];
}

function middleware(name: string, log: string[], response?: Response): MiddlewareFunction {
	return {
		enter: () => {
			log.push(`${name}.enter`);
			return response;
		},
		exit: () => {
			log.push(`${name}.exit`);
		},
	};
}

describe("global middleware", () => {
	test("runs for every request, matched or not", async () => {
		const log: string[] = [];
		const load = createServerLoad(new Router().addPages(routes()), "", [middleware("m", log)]);

		const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);
		expect(res.status).toBe(200);
		// Also for a request that matches nothing (which becomes the
		// error-page redirect)
		const missing = await load(new ServerEvent(new Request("http://localhost/nope")), template);
		expect(missing.status).toBe(303);
		expect(log).toEqual(["m.enter", "m.exit", "m.enter", "m.exit"]);
	});

	test("enter can short-circuit (maintenance mode)", async () => {
		const log: string[] = [];
		const load = createServerLoad(new Router().addPages(routes()), "", [
			middleware("m", log, new Response("down for maintenance", { status: 503 })),
		]);

		const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);
		expect(res.status).toBe(503);
		expect(await res.text()).toBe("down for maintenance");
		// The short-circuiting middleware was entered, so its exit runs
		expect(log).toEqual(["m.enter", "m.exit"]);
	});

	test("exits run in reverse, and see handler errors", async () => {
		const log: string[] = [];
		const failing: MiddlewareFunction = {
			enter: () => {
				log.push("outer.enter");
			},
			exit: (ev) => {
				log.push(`outer.exit:${ev.error !== undefined}`);
			},
		};
		const errorRoutes: ManifestRoute[] = [
			{
				path: "/api",
				type: SERVER_ROUTE,
				endPoint: () =>
					Promise.resolve({
						default: {
							get: () => {
								throw new Error("boom");
							},
						},
					}),
				subFolder: undefined,
			},
		];
		const load = createServerLoad(new Router().addPages(errorRoutes), "", [failing]);

		await expect(
			load(new ServerEvent(new Request("http://localhost/api")), template),
		).rejects.toThrow("boom");
		expect(log).toEqual(["outer.enter", "outer.exit:true"]);
	});

	test("middleware see the raw request url (pre-routing, pre-base-strip)", async () => {
		let seen = "";
		const spy: MiddlewareFunction = {
			enter: (ev) => {
				seen = ev.url.pathname;
			},
		};
		const load = createServerLoad(new Router().addPages(routes()), "/app", [spy]);
		await load(new ServerEvent(new Request("http://localhost/app/posts")), template);
		expect(seen).toBe("/app/posts");
	});
});

describe("route middleware", () => {
	test("runs after global middleware and before the handler", async () => {
		const log: string[] = [];
		const load = createServerLoad(new Router().addPages(routes([middleware("route", log)])), "", [
			middleware("global", log),
		]);

		const res = await load(new ServerEvent(new Request("http://localhost/api")), template);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("api");
		expect(log).toEqual(["global.enter", "route.enter", "route.exit", "global.exit"]);
	});

	test("short-circuits the handler (auth guard)", async () => {
		const log: string[] = [];
		const guard = middleware("guard", log, new Response("no", { status: 401 }));
		const load = createServerLoad(new Router().addPages(routes([guard])));

		const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);
		expect(res.status).toBe(401);
		expect(log).toEqual(["guard.enter", "guard.exit"]);
	});

	test("page server endpoint middleware runs for the page and its actions", async () => {
		const log: string[] = [];
		const load = createServerLoad(new Router().addPages(routes([middleware("page", log)])));

		// The page render (GET /posts uses the sibling +page.server's middleware)
		await load(new ServerEvent(new Request("http://localhost/posts")), template);
		expect(log).toEqual(["page.enter", "page.exit"]);
	});
});
