import { describe, expect, test } from "vite-plus/test";
import { DATA_REQUEST_HEADER } from "../src/dataRequest";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import {
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../src/types/RouteType";
import type MiddlewareFunction from "../src/server/types/MiddlewareFunction";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerEndPoint from "../src/types/ServerEndPoint";
import type ServerHook from "../src/types/ServerHook";

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
		// Also for a request that matches nothing (which gets the not-found
		// response, since this site has no error page)
		const missing = await load(new ServerEvent(new Request("http://localhost/nope")), template);
		expect(missing.status).toBe(404);
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

describe("route middleware and folder hooks", () => {
	/** A root hook that loads the user, as an auth hook would. */
	function authHook(log: string[]): ManifestRoute {
		const hook: ServerHook = {
			enter: (ev) => {
				log.push("hook.enter");
				ev.appData.user = "alice";
			},
			exit: () => {
				log.push("hook.exit");
			},
		};
		return {
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: hook }),
			subFolder: undefined,
		};
	}

	/** Route middleware that only lets alice through. */
	function aliceOnly(log: string[]): MiddlewareFunction {
		return {
			enter: (ev) => {
				log.push(`route.enter user=${ev.appData.user}`);
				if (ev.appData.user !== "alice") return new Response("no", { status: 403 });
			},
			exit: () => {
				log.push("route.exit");
			},
		};
	}

	for (const [name, path, init] of [
		["a page render", "/posts", undefined],
		["an endpoint", "/api", undefined],
		["a page server endpoint", "/posts/~server", undefined],
		["a data request", "/posts/~server", { headers: { [DATA_REQUEST_HEADER]: "1" } }],
	] as const) {
		test(`hooks run first, so the middleware sees their appData (${name})`, async () => {
			const log: string[] = [];
			const load = createServerLoad(
				new Router().addPages([authHook(log), ...routes([aliceOnly(log)])]),
			);

			const res = await load(
				new ServerEvent(new Request(`http://localhost${path}`, init)),
				template,
			);

			expect(res.status).toBe(200);
			expect(log).toEqual(["hook.enter", "route.enter user=alice", "route.exit", "hook.exit"]);
		});
	}

	test("a hook's short-circuit skips the route middleware", async () => {
		const log: string[] = [];
		const hookRoute = authHook(log);
		hookRoute.endPoint = () =>
			Promise.resolve({
				default: {
					enter: () => {
						log.push("hook.enter");
						return new Response(null, { status: 303, headers: { Location: "/login" } });
					},
				} satisfies ServerHook,
			});
		const load = createServerLoad(new Router().addPages([hookRoute, ...routes([aliceOnly(log)])]));

		const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);

		expect(res.status).toBe(303);
		expect(log).toEqual(["hook.enter"]);
	});
});

describe("layout middleware", () => {
	// A layout server endpoint with a (misplaced) guard. It's typed loosely,
	// as LayoutServerEndPoint doesn't allow middleware
	function layoutRoutes(): ManifestRoute[] {
		const layoutServer: Record<string, unknown> = {
			load: async () => ok({}),
			middleware: [{ enter: () => new Response("no", { status: 401 }) }],
		};
		return [
			{
				path: "/_layout",
				type: LAYOUT_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: (_: any, __: any, slots: any) => slots._() } }),
				subFolder: undefined,
			},
			{
				path: "/_layout/~server",
				type: LAYOUT_SERVER_ROUTE,
				endPoint: () => Promise.resolve({ default: layoutServer }),
				subFolder: undefined,
			},
			...routes(),
		];
	}

	test("is an error rather than silently ignored (page render)", async () => {
		const load = createServerLoad(new Router().addPages(layoutRoutes()));
		await expect(
			load(new ServerEvent(new Request("http://localhost/posts")), template),
		).rejects.toThrow(/_hook\.server\.ts/);
	});

	test("is an error rather than silently ignored (data request)", async () => {
		const load = createServerLoad(new Router().addPages(layoutRoutes()));
		const ev = new ServerEvent(
			new Request("http://localhost/posts/~server", { headers: { [DATA_REQUEST_HEADER]: "1" } }),
		);
		await expect(load(ev, template)).rejects.toThrow(/_hook\.server\.ts/);
	});
});
