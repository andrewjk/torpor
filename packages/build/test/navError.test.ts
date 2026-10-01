// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { mount } from "@torpor/view";

vi.mock("@torpor/view", () => ({
	// The render machinery is stubbed out; navigate is what's under test
	$watch: (value: any) => value,
	clearLayoutSlot: vi.fn(),
	fillLayoutSlot: vi.fn(),
	hydrate: vi.fn(),
	mount: vi.fn(),
	unmount: vi.fn(),
}));

import { DATA_REUSE_HEADER } from "../src/dataRequest";
import loadData from "../src/nav/loadData";
import navigate from "../src/nav/navigate";
import $page from "../src/state/$page";
import client from "../src/state/client";
import Router from "../src/site/Router";
import type LayoutPath from "../src/types/LayoutPath";
import type RouteHandler from "../src/types/RouteHandler";
import type ManifestRoute from "../src/types/ManifestRoute";
import { ERROR_ROUTE, PAGE_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";

const mountMock = vi.mocked(mount);

const pageComponent = () => ({ body: "<p>page</p>", head: "" });
const errorComponent = () => ({ body: "<p>error page</p>", head: "" });

const failingLoad = async () =>
	new Response(JSON.stringify({ message: "db boom" }), {
		status: 500,
		headers: { "Content-Type": "application/json" },
	});

const redirectingLoad = async () =>
	new Response(null, { status: 303, headers: { location: "/login" } });

const notFoundLoad = async () => new Response("nope", { status: 404 });

function routesWith(load: (ev: any) => Promise<Response>, withErrorRoute = true): ManifestRoute[] {
	const routes: ManifestRoute[] = [
		{
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: pageComponent, load } }),
			subFolder: undefined,
		},
	];
	if (withErrorRoute) {
		routes.push({
			path: "/_error",
			type: ERROR_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: errorComponent } }),
			subFolder: undefined,
		});
	}
	return routes;
}

beforeEach(() => {
	client.router = new Router();
	client.layoutStack = [];
	client.prefetchedData = {};
	document.body.innerHTML = '<div id="app"></div>';
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	vi.mocked(mount).mockClear();
	vi.mocked(mount).mockImplementation(() => {});
});

describe("loadData", () => {
	test("returns the error status and message of a failed load", async () => {
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { load: failingLoad } }),
		};
		const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {
			load: failingLoad,
		} as any);

		expect(result?.error).toEqual({ status: 500, message: "db boom" });
	});

	test("returns undefined for a redirecting load, so the full page load follows it", async () => {
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { load: redirectingLoad } }),
		};
		const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {
			load: redirectingLoad,
		} as any);

		expect(result).toBeUndefined();
	});

	test("an html error body (a static host's 404) is not used as the message", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal(
			"fetch",
			fetchMock.mockResolvedValue(
				new Response("<html><body>host 404 page</body></html>", {
					status: 404,
					headers: { "Content-Type": "text/html" },
				}),
			),
		);
		try {
			const handler: RouteHandler = {
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: {} }),
				serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
			};
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {});

			expect(result?.error?.status).toBe(404);
			// The html body is not used as the message (statusText is the
			// fallback, which Node's Response leaves empty)
			expect(result?.error?.message ?? "").not.toContain("host 404 page");
		} finally {
			vi.unstubAllGlobals();
		}
	});
});

describe("layout reuse", () => {
	test("a reused layout's data and client load are not re-fetched or re-run", async () => {
		const layoutLoads: number[] = [];
		const layoutEndpoint = {
			load: async () => {
				layoutLoads.push(1);
				return Response.json({ layoutLoad: layoutLoads.length });
			},
		};
		const pageLoad = async () => Response.json({ pageLoad: true });

		const handler: RouteHandler = {
			path: "/dashboard",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
			layouts: [
				{
					path: "/_layout",
					endPoint: () => Promise.resolve({ default: layoutEndpoint }),
					serverEndPoint: () =>
						Promise.resolve({ default: { load: async () => Response.json({ user: "alice" }) } }),
				},
			],
		};

		const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
			const reuse = (init?.headers as Record<string, string> | undefined)?.[DATA_REUSE_HEADER];
			// A reused layout's slot comes back null
			return Response.json({ loads: reuse ? [null, null] : [{ user: "alice" }, null] });
		});
		vi.stubGlobal("fetch", fetchMock);

		try {
			// First navigation: the layout is new, so its client load runs and
			// its server data is merged
			const first: LayoutPath[] = [];
			const result1 = await loadData(handler, {}, "/dashboard", new URLSearchParams(), first, {
				load: pageLoad,
			});
			expect(layoutLoads).toEqual([1]);
			expect(result1?.data).toEqual({ layoutLoad: 1, user: "alice", pageLoad: true });

			// Second navigation within the same layout: it is reused, so its
			// client load does not run again and its cached data is kept
			client.layoutStack = first;
			const second: LayoutPath[] = [];
			const result2 = await loadData(handler, {}, "/dashboard", new URLSearchParams(), second, {
				load: pageLoad,
			});
			expect(layoutLoads).toEqual([1]);
			expect(second[0].reuse).toBe(true);
			expect(second[0].slotRegion).toBe(first[0].slotRegion);
			expect(result2?.data).toEqual({ layoutLoad: 1, user: "alice", pageLoad: true });

			// The client told the server to skip the reused layout's load
			const init = fetchMock.mock.calls[1][1]!;
			expect((init.headers as Record<string, string>)[DATA_REUSE_HEADER]).toBe(
				JSON.stringify(["/_layout"]),
			);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});

describe("navigate", () => {
	test("a failed load renders the error page at the requested url", async () => {
		client.router.addPages(routesWith(failingLoad));

		const navigated = await navigate(new URL("http://localhost/posts"));

		// The navigation succeeds: the error page is rendered in place and
		// the caller keeps the requested url in the address bar
		expect(navigated).toBe(true);
		expect(mountMock).toHaveBeenCalledTimes(1);
		// The error route's component was rendered
		expect(mountMock.mock.calls[0][1]).toBe(errorComponent);
		expect($page.status).toBe(500);
		expect($page.error?.message).toBe("db boom");
	});

	test("a failed load falls back to a full page load without an error route", async () => {
		client.router.addPages(routesWith(failingLoad, false));

		const navigated = await navigate(new URL("http://localhost/posts"));

		expect(navigated).toBe(false);
		expect(mountMock).not.toHaveBeenCalled();
	});

	test("a redirecting load is left to the full page load", async () => {
		client.router.addPages(routesWith(redirectingLoad));

		const navigated = await navigate(new URL("http://localhost/posts"));

		expect(navigated).toBe(false);
		expect(mountMock).not.toHaveBeenCalled();
	});

	test("an unmatched url renders the error page at it", async () => {
		client.router.addPages(routesWith(notFoundLoad));

		const navigated = await navigate(new URL("http://localhost/nope"));

		expect(navigated).toBe(true);
		expect(mountMock).toHaveBeenCalledTimes(1);
		expect(mountMock.mock.calls[0][1]).toBe(errorComponent);
		expect($page.status).toBe(404);
		expect($page.error?.message).toBe("Not found");
	});

	test("a server-only route falls back to a full page load", async () => {
		// e.g. a `/logout` +server route: there's no client component, so the
		// client can't render it -- navigate must return false (not throw) so
		// the click handler does a full page load and hits the server route
		client.router.addPages([
			{
				path: "/logout",
				type: SERVER_ROUTE,
				endPoint: undefined as any,
				subFolder: undefined,
			},
		]);

		const navigated = await navigate(new URL("http://localhost/logout"));

		expect(navigated).toBe(false);
		expect(mountMock).not.toHaveBeenCalled();
	});

	test("a successful navigation still renders the page", async () => {
		client.router.addPages(routesWith(notFoundLoad));
		const okLoad = async () => Response.json({ hello: "world" });
		client.router.addPages([
			{
				path: "/",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent, load: okLoad } }),
				subFolder: undefined,
			},
		]);

		const navigated = await navigate(new URL("http://localhost/"));

		expect(navigated).toBe(true);
		expect(mountMock.mock.calls[0][1]).toBe(pageComponent);
		expect($page.status).toBe(200);
	});
});
