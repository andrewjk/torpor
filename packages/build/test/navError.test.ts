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

import loadData from "../src/nav/loadData";
import navigate from "../src/nav/navigate";
import $page from "../src/state/$page";
import client from "../src/state/client";
import Router from "../src/site/Router";
import type RouteHandler from "../src/types/RouteHandler";
import type ManifestRoute from "../src/types/ManifestRoute";
import { ERROR_ROUTE, PAGE_ROUTE } from "../src/types/RouteType";

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
		const result = await loadData(
			handler,
			{},
			"/posts",
			new URLSearchParams(),
			[],
			{
				load: failingLoad,
			} as any,
			undefined,
		);

		expect(result?.error).toEqual({ status: 500, message: "db boom" });
	});

	test("returns undefined for a redirecting load, so the full page load follows it", async () => {
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { load: redirectingLoad } }),
		};
		const result = await loadData(
			handler,
			{},
			"/posts",
			new URLSearchParams(),
			[],
			{
				load: redirectingLoad,
			} as any,
			undefined,
		);

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
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {}, {
				load: async () => {},
			} as any);

			expect(result?.error?.status).toBe(404);
			// The html body is not used as the message (statusText is the
			// fallback, which Node's Response leaves empty)
			expect(result?.error?.message ?? "").not.toContain("host 404 page");
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
