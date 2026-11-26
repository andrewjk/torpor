// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { clearLayoutSlot, fillLayoutSlot, mount, unmount } from "@torpor/view";

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
import navigate, { type NavigationResult } from "../src/nav/navigate";
import $page from "../src/state/$page";
import client from "../src/state/client";
import Router from "../src/site/Router";
import type LayoutPath from "../src/types/LayoutPath";
import type RouteHandler from "../src/types/RouteHandler";
import type ManifestRoute from "../src/types/ManifestRoute";
import { ERROR_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";

const mountMock = vi.mocked(mount);
const unmountMock = vi.mocked(unmount);
const clearLayoutSlotMock = vi.mocked(clearLayoutSlot);
const fillLayoutSlotMock = vi.mocked(fillLayoutSlot);

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

/** The error a failed navigation carried, for assertions. */
function failedError(result: NavigationResult): unknown {
	return result.type === "failed" ? result.error : undefined;
}

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
	client.prefetchedServerData = {};
	document.body.innerHTML = '<div id="app"></div>';
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	vi.mocked(mount).mockClear();
	vi.mocked(mount).mockImplementation(() => {});
	unmountMock.mockClear();
	clearLayoutSlotMock.mockClear();
	fillLayoutSlotMock.mockClear();
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

	test("a rejected fetch becomes a renderable 503 error", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("network down");
			}),
		);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const handler: RouteHandler = {
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: {} }),
				serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
			};
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {});

			expect(result?.error).toEqual({ status: 503, message: "Could not reach the server." });
		} finally {
			consoleError.mockRestore();
			vi.unstubAllGlobals();
		}
	});

	test("the 503 message says offline when the browser reports no network", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("network down");
			}),
		);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
		try {
			const handler: RouteHandler = {
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: {} }),
				serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
			};
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {});

			expect(result?.error).toEqual({ status: 503, message: "You're offline." });
		} finally {
			online.mockRestore();
			consoleError.mockRestore();
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

describe("layout slot reuse", () => {
	const layoutComponent = () => {};
	const pageRoute = (): ManifestRoute => ({
		path: "/dashboard",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	});
	const layoutRoute = (path = "/_layout"): ManifestRoute => ({
		path,
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: layoutComponent } }),
		subFolder: undefined,
	});
	const liveRegion = () => {
		const node = document.createElement("main");
		document.body.appendChild(node);
		return { startNode: node, endNode: node };
	};

	test("a released reused slot falls back to a full client re-render", async () => {
		client.router.addPages([layoutRoute(), pageRoute()]);

		// The previous navigation's layout slot region was released by a
		// reactive layout update during this navigation: `clearRegion` sets the
		// region's `startNode` to null, and loadData still marks the layout for
		// reuse because the path matches
		client.layoutStack = [
			{
				path: "/_layout",
				data: {},
				reuse: false,
				slotRegion: { startNode: null, endNode: null },
			},
		];

		const navigated = await navigate(new URL("http://localhost/dashboard"));

		// Instead of the old crash (reading 'parentNode' of null, swallowed into
		// the "Script syntax error" placeholder) the whole chain re-renders
		expect(navigated.type).toBe("rendered");
		expect(unmountMock).toHaveBeenCalledTimes(1);
		expect(mountMock).toHaveBeenCalledTimes(1);
		expect(mountMock.mock.calls[0][1]).toBe(layoutComponent);
		expect(document.getElementById("app")!.innerHTML).not.toContain("Script syntax error");
	});

	test("a detached reused slot start node also falls back to a full client re-render", async () => {
		client.router.addPages([layoutRoute(), pageRoute()]);

		// A post-hydration re-render (e.g. an @await page) removed the node the
		// slot region started at: startNode is set but detached from the DOM,
		// so it has no parent to render into
		const detached = document.createElement("main");
		client.layoutStack = [
			{
				path: "/_layout",
				data: {},
				reuse: false,
				slotRegion: { startNode: detached, endNode: detached },
			},
		];

		const navigated = await navigate(new URL("http://localhost/dashboard"));

		expect(navigated.type).toBe("rendered");
		expect(unmountMock).toHaveBeenCalledTimes(1);
		expect(mountMock).toHaveBeenCalledTimes(1);
		expect(mountMock.mock.calls[0][1]).toBe(layoutComponent);
		expect(document.getElementById("app")!.innerHTML).not.toContain("Script syntax error");
	});

	test("keeps the nearest live layout when an inner layout's slot was released", async () => {
		client.router.addPages([layoutRoute(), layoutRoute("/dashboard/_layout"), pageRoute()]);

		// The root layout's slot is alive; the section layout's own slot was
		// released (e.g. a control-flow branch inside the section layout was
		// cleared). The root layout can still be reused
		const rootSlot = liveRegion();
		client.layoutStack = [
			{ path: "/_layout", data: {}, reuse: false, slotRegion: rootSlot },
			{
				path: "/dashboard/_layout",
				data: {},
				reuse: false,
				slotRegion: { startNode: null, endNode: null },
			},
		];

		const navigated = await navigate(new URL("http://localhost/dashboard"));

		expect(navigated.type).toBe("rendered");
		expect(clearLayoutSlotMock).toHaveBeenCalledTimes(1);
		expect(clearLayoutSlotMock.mock.calls[0][0]).toBe(rootSlot);
		// The chain below the live layout is rendered into its slot rather than
		// remounting the whole app
		expect(fillLayoutSlotMock).toHaveBeenCalledTimes(1);
		expect(fillLayoutSlotMock.mock.calls[0][0]).toBe(layoutComponent);
		expect(fillLayoutSlotMock.mock.calls[0][1]).toBeTypeOf("function");
		expect(mountMock).not.toHaveBeenCalled();
		expect(document.getElementById("app")!.innerHTML).not.toContain("Script syntax error");
	});

	test("a reused layout's props are pointed at the new page's data", async () => {
		// The page's client load provides the merged data the layout should see
		const pageLoad = async () => Response.json({ section: "bookings" });
		client.router.addPages([
			layoutRoute(),
			{
				path: "/dashboard",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent, load: pageLoad } }),
				subFolder: undefined,
			},
		]);

		// The layout as it stands after the navigation that created it: its
		// props object is the one its component holds (a `$watch` proxy in
		// production; the mock above makes it the plain object here)
		const props: Record<PropertyKey, any> = { data: { section: "home" }, form: undefined };
		client.layoutStack = [
			{
				path: "/_layout",
				data: {},
				reuse: true,
				slotRegion: liveRegion(),
				props,
			},
		];

		const navigated = await navigate(new URL("http://localhost/dashboard"));

		expect(navigated.type).toBe("rendered");
		// The same object the layout's component holds, now carrying the new
		// page's merged data -- so the layout follows the page it wraps (the
		// server, which re-renders the layout every request, already does)
		expect(client.layoutStack[0].props).toBe(props);
		expect(props.data).toEqual({ section: "bookings" });
		expect(props.form).toBeUndefined();
	});

	test("every reused layout in the chain gets the new page's data", async () => {
		const pageLoad = async () => Response.json({ pageLoad: true });
		client.router.addPages([
			layoutRoute(),
			layoutRoute("/dashboard/_layout"),
			{
				path: "/dashboard",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent, load: pageLoad } }),
				subFolder: undefined,
			},
		]);

		// Two layouts, each created in an earlier navigation with its own props
		// object (the root in an earlier one than the section, say)
		const rootProps: Record<PropertyKey, any> = { data: { older: true }, form: undefined };
		const sectionProps: Record<PropertyKey, any> = { data: { old: true }, form: undefined };
		client.layoutStack = [
			{ path: "/_layout", data: {}, reuse: true, slotRegion: liveRegion(), props: rootProps },
			{
				path: "/dashboard/_layout",
				data: {},
				reuse: true,
				slotRegion: liveRegion(),
				props: sectionProps,
			},
		];

		const navigated = await navigate(new URL("http://localhost/dashboard"));

		expect(navigated.type).toBe("rendered");
		expect(rootProps.data).toEqual({ pageLoad: true });
		expect(sectionProps.data).toEqual({ pageLoad: true });
	});

	test("an error page over live layouts leaves their props alone", async () => {
		// Both the page's and the error page's own loads fail (offline, or the
		// server is down), so the error page renders over the reused layout
		const errorLoad = async () => new Response(null, { status: 500 });
		client.router.addPages([
			layoutRoute(),
			{
				path: "/dashboard",
				type: PAGE_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: pageComponent, load: failingLoad } }),
				subFolder: undefined,
			},
			{
				path: "/_error",
				type: ERROR_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: errorComponent, load: errorLoad } }),
				subFolder: undefined,
			},
		]);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		const props: Record<PropertyKey, any> = { data: { section: "home" }, form: undefined };
		client.layoutStack = [
			{
				path: "/_layout",
				data: {},
				reuse: true,
				slotRegion: liveRegion(),
				props,
			},
		];

		try {
			const navigated = await navigate(new URL("http://localhost/dashboard"));

			expect(navigated.type).toBe("rendered");
			expect(fillLayoutSlotMock).toHaveBeenCalled();
			// The layout keeps the last good page's data: pointing it at the
			// error page's (empty) data would blank a data-driven header while
			// the error is up
			expect(props.data).toEqual({ section: "home" });
		} finally {
			consoleError.mockRestore();
		}
	});
});

describe("navigate", () => {
	test("a failed load renders the error page at the requested url", async () => {
		client.router.addPages(routesWith(failingLoad));

		const navigated = await navigate(new URL("http://localhost/posts"));

		// The navigation succeeds: the error page is rendered in place and
		// the caller keeps the requested url in the address bar
		expect(navigated.type).toBe("rendered");
		expect(mountMock).toHaveBeenCalledTimes(1);
		// The error route's component was rendered
		expect(mountMock.mock.calls[0][1]).toBe(errorComponent);
		expect($page.status).toBe(500);
		expect($page.error?.message).toBe("db boom");
	});

	test("a failed load falls back to a full page load without an error route", async () => {
		client.router.addPages(routesWith(failingLoad, false));

		const navigated = await navigate(new URL("http://localhost/posts"));

		expect(navigated.type).toBe("failed");
		expect(mountMock).not.toHaveBeenCalled();
	});

	test("a redirecting load is left to the full page load", async () => {
		client.router.addPages(routesWith(redirectingLoad));

		const navigated = await navigate(new URL("http://localhost/posts"));

		expect(navigated.type).toBe("redirect");
		expect(mountMock).not.toHaveBeenCalled();
	});

	test("a failed route-module import falls back and restores $page", async () => {
		client.router.addPages([
			{
				path: "/broken",
				type: PAGE_ROUTE,
				endPoint: () =>
					Promise.reject(new TypeError("Failed to fetch dynamically imported module")),
				subFolder: undefined,
			},
		]);
		const current = new URL("http://localhost/current");
		$page.url = current;
		$page.status = 200;
		$page.error = { message: "" };
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const navigated = await navigate(new URL("http://localhost/broken"));

			// The caller falls back to a full page load instead of the click
			// rejecting with the import error
			expect(navigated.type).toBe("failed");
			expect(failedError(navigated)).toBeInstanceOf(TypeError);
			expect(mountMock).not.toHaveBeenCalled();
			// The tab bar/active-link state points at the page still on screen
			expect($page.url).toBe(current);
			expect($page.status).toBe(200);
		} finally {
			consoleError.mockRestore();
		}
	});

	test("a failed data request without an error route falls back and restores $page", async () => {
		client.router.addPages([
			{
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
				subFolder: undefined,
			},
			{
				path: "/posts/~server",
				type: PAGE_SERVER_ROUTE,
				endPoint: () => Promise.resolve({ default: { load: async () => {} } }),
				subFolder: undefined,
			},
		]);
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("network down");
			}),
		);
		const current = new URL("http://localhost/current");
		$page.url = current;
		$page.status = 200;
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const navigated = await navigate(new URL("http://localhost/posts"));

			expect(navigated.type).toBe("failed");
			// The reactive state points back at the page still on screen
			expect($page.url).toBe(current);
			expect($page.status).toBe(200);
		} finally {
			consoleError.mockRestore();
			vi.unstubAllGlobals();
		}
	});

	test("a rejected data request renders the error page in place", async () => {
		client.router.addPages([
			{
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
				subFolder: undefined,
			},
			{
				path: "/posts/~server",
				type: PAGE_SERVER_ROUTE,
				endPoint: () => Promise.resolve({ default: { load: async () => {} } }),
				subFolder: undefined,
			},
			{
				path: "/_error",
				type: ERROR_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: errorComponent } }),
				subFolder: undefined,
			},
		]);
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("network down");
			}),
		);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const navigated = await navigate(new URL("http://localhost/posts"));

			// The 503 renders in the shell at the requested url, rather than
			// the caller blanking it with a document load that would fail too
			expect(navigated.type).toBe("rendered");
			expect(mountMock).toHaveBeenCalledTimes(1);
			expect(mountMock.mock.calls[0][1]).toBe(errorComponent);
			expect($page.status).toBe(503);
			expect($page.error?.message).toBe("Could not reach the server.");
			expect($page.url.pathname).toBe("/posts");
		} finally {
			consoleError.mockRestore();
			vi.unstubAllGlobals();
		}
	});

	test("an error page whose own data fails renders over the live shell", async () => {
		// The root layout is on screen with live data and a slot region
		const node = document.createElement("main");
		document.body.appendChild(node);
		const liveSlot = { startNode: node, endNode: node };
		client.layoutStack = [
			{ path: "/_layout", data: { user: "alice" }, reuse: false, slotRegion: liveSlot },
		];

		const layoutComponent = () => {};
		client.router.addPages([
			{
				path: "/_layout",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: layoutComponent } }),
				subFolder: undefined,
			},
			{
				path: "/_layout/~server",
				type: PAGE_SERVER_ROUTE,
				endPoint: () => Promise.resolve({ default: { load: async () => {} } }),
				subFolder: undefined,
			},
			{
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
				subFolder: undefined,
			},
			{
				path: "/_error",
				type: ERROR_ROUTE,
				endPoint: () => Promise.resolve({ default: { component: errorComponent } }),
				subFolder: undefined,
			},
		]);
		const fetchMock = vi.fn(async () => {
			throw new TypeError("network down");
		});
		vi.stubGlobal("fetch", fetchMock);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const navigated = await navigate(new URL("http://localhost/posts"));

			// The page's request and the error page's own request (its root
			// layout has a server load) both fail; the error still renders in
			// the live layout instead of blanking the shell
			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(navigated.type).toBe("rendered");
			expect($page.status).toBe(503);
			expect(mountMock).not.toHaveBeenCalled();
			expect(clearLayoutSlotMock).toHaveBeenCalledWith(liveSlot);
			expect(fillLayoutSlotMock).toHaveBeenCalledTimes(1);
			expect(fillLayoutSlotMock.mock.calls[0][0]).toBe(errorComponent);
			// The live layout was adopted for reuse with its data intact
			expect(client.layoutStack[0].reuse).toBe(true);
			expect(client.layoutStack[0].data).toEqual({ user: "alice" });
		} finally {
			consoleError.mockRestore();
			vi.unstubAllGlobals();
		}
	});

	test("an unmatched url renders the error page at it", async () => {
		client.router.addPages(routesWith(notFoundLoad));

		const navigated = await navigate(new URL("http://localhost/nope"));

		expect(navigated.type).toBe("rendered");
		expect(mountMock).toHaveBeenCalledTimes(1);
		expect(mountMock.mock.calls[0][1]).toBe(errorComponent);
		expect($page.status).toBe(404);
		expect($page.error?.message).toBe("Not found");
	});

	test("a direct error-page navigation only accepts 4xx/5xx statuses", async () => {
		client.router.addPages(routesWith(notFoundLoad));

		const cases: [string, number][] = [
			["status=403", 403],
			["status=500", 500],
			["status=abc", 404],
			["status=999", 404],
			["status=200", 404],
			["status=302", 404],
		];
		for (const [query, expected] of cases) {
			const navigated = await navigate(new URL(`/_error?${query}`, window.location.href));
			expect(navigated.type).toBe("rendered");
			expect($page.status, query).toBe(expected);
		}
	});

	test("a server-only route falls back to a full page load", async () => {
		// e.g. a `/logout` +server route: there's no client component, so the
		// client can't render it -- navigate reports `server-only` (rather than
		// throwing) so the click handler does a full page load and hits the
		// server route
		client.router.addPages([
			{
				path: "/logout",
				type: SERVER_ROUTE,
				endPoint: undefined as any,
				subFolder: undefined,
			},
		]);

		const navigated = await navigate(new URL("http://localhost/logout"));

		expect(navigated.type).toBe("server-only");
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

		expect(navigated.type).toBe("rendered");
		expect(mountMock.mock.calls[0][1]).toBe(pageComponent);
		expect($page.status).toBe(200);
		// Components read the page state from the root context
		expect(mountMock.mock.calls[0][4]?.$page).toBe($page);
	});

	test("the latest navigation wins over an earlier one still loading", async () => {
		const events: string[] = [];
		let releaseFirst!: () => void;
		const firstGate = new Promise<void>((resolve) => (releaseFirst = resolve));
		const firstLoad = async () => {
			events.push("first:start");
			await firstGate;
			events.push("first:end");
			return Response.json({});
		};
		const secondLoad = async () => {
			events.push("second:start");
			return Response.json({});
		};
		const firstComponent = () => ({ body: "<p>first</p>", head: "" });
		const secondComponent = () => ({ body: "<p>second</p>", head: "" });
		client.router.addPages([
			{
				path: "/first",
				type: PAGE_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: firstComponent, load: firstLoad } }),
				subFolder: undefined,
			},
			{
				path: "/second",
				type: PAGE_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: secondComponent, load: secondLoad } }),
				subFolder: undefined,
			},
		]);

		const first = navigate(new URL("http://localhost/first"));
		// Let the slow navigation start its load before the second supersedes it
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(events).toEqual(["first:start"]);

		const second = navigate(new URL("http://localhost/second"));

		// The newest navigation no longer waits for the slow one to finish
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(events).toEqual(["first:start", "second:start"]);

		expect(await second).toEqual({ type: "rendered" });
		expect(mountMock.mock.calls.at(-1)![1]).toBe(secondComponent);
		expect($page.url.pathname).toBe("/second");

		// The superseded navigation settles without painting over the winner
		releaseFirst();
		expect(await first).toEqual({ type: "superseded" });
		expect(mountMock.mock.calls.at(-1)![1]).toBe(secondComponent);
		expect($page.url.pathname).toBe("/second");
	});

	test("a hung data request is aborted by the next navigation", async () => {
		let slowSignal: AbortSignal | undefined;
		const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
			const href =
				input instanceof URL ? input.href : typeof input === "string" ? input : input.url;
			if (href.includes("/slow/~server")) {
				slowSignal = init?.signal ?? undefined;
				return new Promise<Response>((_, reject) => {
					slowSignal?.addEventListener("abort", () =>
						reject(new DOMException("The operation was aborted.", "AbortError")),
					);
				});
			}
			return Promise.resolve(Response.json({ loads: [{}] }));
		});
		vi.stubGlobal("fetch", fetchMock);
		try {
			const server = () => Promise.resolve({ default: { load: async () => {} } });
			client.router.addPages([
				{
					path: "/slow",
					type: PAGE_ROUTE,
					endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
					subFolder: undefined,
				},
				{
					path: "/slow/~server",
					type: PAGE_SERVER_ROUTE,
					endPoint: server,
					subFolder: undefined,
				},
				{
					path: "/fast",
					type: PAGE_ROUTE,
					endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
					subFolder: undefined,
				},
				{
					path: "/fast/~server",
					type: PAGE_SERVER_ROUTE,
					endPoint: server,
					subFolder: undefined,
				},
			]);

			const slow = navigate(new URL("http://localhost/slow"));
			// Let the slow request start before the next navigation supersedes it
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(slowSignal?.aborted).toBe(false);

			const fast = navigate(new URL("http://localhost/fast"));
			expect(slowSignal?.aborted).toBe(true);
			expect(await fast).toEqual({ type: "rendered" });
			expect(await slow).toEqual({ type: "superseded" });
			// The fast navigation made its own request instead of reusing the
			// hung one
			expect(fetchMock).toHaveBeenCalledTimes(2);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});

describe("page meta", () => {
	test("a navigation replaces $page.meta with the page endpoint's", async () => {
		client.router.addPages([
			{
				path: "/booking",
				type: PAGE_ROUTE,
				endPoint: () =>
					Promise.resolve({ default: { component: pageComponent, meta: { bare: true } } }),
				subFolder: undefined,
			},
		]);
		$page.meta = { bare: false };

		const navigated = await navigate(new URL("http://localhost/booking"));

		expect(navigated.type).toBe("rendered");
		expect($page.meta).toEqual({ bare: true });
	});

	test("a failed navigation restores the previous $page.meta", async () => {
		client.router.addPages(routesWith(failingLoad, false));
		$page.meta = { bare: false };
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const navigated = await navigate(new URL("http://localhost/posts"));

			// The navigation failed and the page is kept, so its meta is kept
			// with it (the new page's meta was set while the loads ran)
			expect(navigated.type).toBe("failed");
			expect($page.meta).toEqual({ bare: false });
		} finally {
			consoleError.mockRestore();
		}
	});
});

describe("prefetch", () => {
	const serverHandler = (): RouteHandler => ({
		path: "/posts",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: {} }),
		serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
	});

	test("a prefetched server request is reused by the navigation that follows", async () => {
		const fetchMock = vi.fn(async () => Response.json({ loads: [{ pageLoad: true }] }));
		vi.stubGlobal("fetch", fetchMock);
		try {
			const handler = serverHandler();

			// Hovering (or focusing) the link warms the page's server data ...
			await loadData(handler, {}, "/posts", new URLSearchParams(), [], {}, true);
			expect(fetchMock).toHaveBeenCalledTimes(1);

			// ... and the navigation consumes it, with no second request
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {});
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(result?.data).toEqual({ pageLoad: true });
		} finally {
			vi.unstubAllGlobals();
		}
	});

	test("a navigation that lands mid-prefetch awaits the same request", async () => {
		let releaseFetch!: (response: Response) => void;
		const fetchMock = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					releaseFetch = resolve;
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		try {
			const handler = serverHandler();

			const prefetch = loadData(handler, {}, "/posts", new URLSearchParams(), [], {}, true);
			const navigation = loadData(handler, {}, "/posts", new URLSearchParams(), [], {});
			expect(fetchMock).toHaveBeenCalledTimes(1);

			releaseFetch(Response.json({ loads: [{ pageLoad: true }] }));
			await prefetch;
			expect((await navigation)?.data).toEqual({ pageLoad: true });
		} finally {
			vi.unstubAllGlobals();
		}
	});

	test("a failed prefetch is not cached, so the navigation retries", async () => {
		let attempt = 0;
		const fetchMock = vi.fn(async () => {
			attempt += 1;
			if (attempt === 1) throw new TypeError("network down");
			return Response.json({ loads: [{ pageLoad: true }] });
		});
		vi.stubGlobal("fetch", fetchMock);
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const handler = serverHandler();

			// The prefetch resolves with the unreachable error rather than
			// rejecting, and is dropped from the cache ...
			const prefetched = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {}, true);
			expect(prefetched?.error?.status).toBe(503);

			// ... so the navigation retries and gets fresh data
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], {});
			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(result?.data).toEqual({ pageLoad: true });
		} finally {
			consoleError.mockRestore();
			vi.unstubAllGlobals();
		}
	});

	test("a navigation that lands mid-prefetch awaits the same client load", async () => {
		let calls = 0;
		let release!: () => void;
		const gate = new Promise<void>((resolve) => (release = resolve));
		const load = async () => {
			calls += 1;
			await gate;
			return Response.json({ loaded: true });
		};
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: pageComponent, load } }),
		};

		const prefetch = loadData(handler, {}, "/posts", new URLSearchParams(), [], { load }, true);
		const navigation = loadData(handler, {}, "/posts", new URLSearchParams(), [], { load });
		// Let both reach their client loads; the second must join the first
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(calls).toBe(1);

		release();
		await prefetch;
		expect((await navigation)?.data).toEqual({ loaded: true });
		expect(calls).toBe(1);
	});

	test("a failed in-flight client load is not cached, so the navigation retries", async () => {
		let calls = 0;
		const load = async () => {
			calls += 1;
			if (calls === 1) throw new TypeError("network down");
			return Response.json({ loaded: true });
		};
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: pageComponent, load } }),
		};
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			// The throwing load becomes a renderable 500 for the prefetch ...
			const prefetched = await loadData(
				handler,
				{},
				"/posts",
				new URLSearchParams(),
				[],
				{ load },
				true,
			);
			expect(prefetched?.error).toEqual({ status: 500, message: "Internal error" });

			// ... and is dropped, so the navigation retries and succeeds
			const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], { load });
			expect(calls).toBe(2);
			expect(result?.data).toEqual({ loaded: true });
		} finally {
			consoleError.mockRestore();
		}
	});

	test("a prefetch skips layouts already on screen without adopting their slots", async () => {
		let layoutLoads = 0;
		const handler: RouteHandler = {
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
			layouts: [
				{
					path: "/_layout",
					endPoint: () =>
						Promise.resolve({
							default: {
								load: async () => {
									layoutLoads += 1;
									return Response.json({ layoutLoad: layoutLoads });
								},
							},
						}),
					serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
				},
			],
			serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
		};

		const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
			const reuse = (init?.headers as Record<string, string> | undefined)?.[DATA_REUSE_HEADER];
			return Response.json({ loads: reuse ? [null, { pageServer: true }] : [{}, {}] });
		});
		vi.stubGlobal("fetch", fetchMock);

		try {
			// The layout is on screen, with live data and a slot region
			const liveSlot = {} as any;
			client.layoutStack = [
				{ path: "/_layout", data: { layoutLoad: 1 }, reuse: false, slotRegion: liveSlot },
			];

			const stack: LayoutPath[] = [];
			const result = await loadData(
				handler,
				{},
				"/posts",
				new URLSearchParams(),
				stack,
				{ load: async () => Response.json({ pageLoad: true }) },
				true,
			);

			// The server was told to skip the layout's load ...
			const init = fetchMock.mock.calls[0][1]!;
			expect((init.headers as Record<string, string>)[DATA_REUSE_HEADER]).toBe(
				JSON.stringify(["/_layout"]),
			);
			// ... and the prefetch didn't run its client load or adopt its slot
			expect(layoutLoads).toBe(0);
			expect(stack[0].reuse).toBe(false);
			expect(stack[0].slotRegion).toBeNull();
			expect(stack[0].data).toEqual({ layoutLoad: 1 });
			expect(result?.data).toEqual({ layoutLoad: 1, pageServer: true, pageLoad: true });
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
