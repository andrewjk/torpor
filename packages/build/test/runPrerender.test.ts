import { describe, expect, test } from "vite-plus/test";
import { expandPath, resolvePrerenderPaths } from "../src/run/runPrerender";
import Router from "../src/site/Router";
import { ERROR_ROUTE, LAYOUT_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

// Mirrors serverEntry's routes export
function routesOf(router: Router) {
	return router.routes.map((r) => r.handler);
}

function pageFlag(flag: boolean) {
	return async () => ({ default: { component: () => {}, prerender: flag } });
}

function pageOnly() {
	return async () => ({ default: { component: () => {} } });
}

function serverFlag(flag: unknown) {
	return async () => ({ default: { prerender: flag } });
}

function layoutFlag(flag: boolean | undefined) {
	return async () =>
		flag === undefined ? { default: { component: () => {} } } : { default: { prerender: flag } };
}

describe("expandPath", () => {
	test("fills single and rest params", () => {
		expect(expandPath("/posts/[id]", { id: "1" })).toBe("/posts/1");
		expect(expandPath("/docs/[...path]", { path: "a/b/c" })).toBe("/docs/a/b/c");
		expect(expandPath("/u/[user]/posts/[id]", { user: "a", id: 2 })).toBe("/u/a/posts/2");
	});

	test("throws for a missing param", () => {
		expect(() => expandPath("/posts/[id]", {})).toThrow(/Missing param "id"/);
	});
});

describe("resolvePrerenderPaths", () => {
	test("returns nothing when no flags are set", async () => {
		const router = new Router();
		router.addPage("/", PAGE_ROUTE, pageOnly());
		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		expect(result).toEqual([]);
	});

	test("includes static pages flagged on their endpoint", async () => {
		const router = new Router();
		router.addPage("/", PAGE_ROUTE, pageFlag(true));
		router.addPage("/about", PAGE_ROUTE, pageOnly());
		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		expect(result).toEqual([{ path: "/", params: undefined }]);
	});

	test("includes pages flagged by the nearest layout", async () => {
		const router = new Router();
		router.addPage("/blog/[slug]", PAGE_ROUTE, pageOnly());
		router.addPage(
			"/blog/[slug]/~server",
			PAGE_SERVER_ROUTE,
			serverFlag({ params: [{ slug: "a" }] }),
		);
		router.addPage("/blog/_layout", LAYOUT_ROUTE, layoutFlag(true));
		router.addPage("/about", PAGE_ROUTE, pageOnly());

		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		expect(result).toEqual([{ path: "/blog/a", params: { slug: "a" } }]);
	});

	test("page and server endpoint flags override the layout", async () => {
		const router = new Router();
		router.addPage("/in", PAGE_ROUTE, pageOnly());
		router.addPage("/out", PAGE_ROUTE, pageFlag(false));
		router.addPage("/_layout", LAYOUT_ROUTE, layoutFlag(true));

		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		expect(result).toEqual([{ path: "/in", params: undefined }]);
	});

	test("a nearer layout overrides a farther one", async () => {
		const router = new Router();
		router.addPage("/a/b", PAGE_ROUTE, pageOnly());
		router.addPage("/x/y", PAGE_ROUTE, pageOnly());
		router.addPage("/_layout", LAYOUT_ROUTE, layoutFlag(false));
		router.addPage("/a/_layout", LAYOUT_ROUTE, layoutFlag(true));

		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		// /a/b's nearest layout (/a) says true; /x/y falls back to the root
		expect(result).toEqual([{ path: "/a/b", params: undefined }]);
	});

	test("a dynamic route requires params entries", async () => {
		const router = new Router();
		router.addPage("/posts/[id]", PAGE_ROUTE, pageFlag(true));
		await expect(resolvePrerenderPaths(routesOf(router), undefined)).rejects.toThrow(
			/\/posts\/\[id\].*params entries/,
		);
	});

	test("expands params entries for single and rest segments", async () => {
		const router = new Router();
		router.addPage("/posts/[id]", PAGE_ROUTE, pageOnly());
		router.addPage(
			"/posts/[id]/~server",
			PAGE_SERVER_ROUTE,
			serverFlag({ params: [{ id: "1" }, { id: "2" }] }),
		);
		// A [...path] route can't have a sibling ~server endpoint (the splat
		// must be the last segment), so its entries live on the page endpoint
		router.addPage("/docs/[...path]", PAGE_ROUTE, async () => ({
			default: { component: () => {}, prerender: { params: [{ path: "a/b" }, { path: "c" }] } },
		}));

		const result = await resolvePrerenderPaths(routesOf(router), undefined);
		expect(result).toEqual([
			{ path: "/docs/a/b", params: { path: "a/b" } },
			{ path: "/docs/c", params: { path: "c" } },
			{ path: "/posts/1", params: { id: "1" } },
			{ path: "/posts/2", params: { id: "2" } },
		]);
	});

	test("site.prerender true is a default, overridable per route", async () => {
		const router = new Router();
		router.addPage("/", PAGE_ROUTE, pageOnly());
		router.addPage("/account", PAGE_ROUTE, pageFlag(false));

		const result = await resolvePrerenderPaths(routesOf(router), true);
		expect(result).toEqual([{ path: "/", params: undefined }]);
	});

	test("site.prerender map: exact and prefix patterns, longest match wins", async () => {
		const router = new Router();
		router.addPage("/blog", PAGE_ROUTE, pageOnly());
		router.addPage("/blog/secret", PAGE_ROUTE, pageOnly());
		router.addPage("/docs", PAGE_ROUTE, pageOnly());

		const result = await resolvePrerenderPaths(routesOf(router), {
			"/blog/**": true,
			"/blog/secret": false,
			"/docs": true,
		});
		expect(result).toEqual([
			{ path: "/blog", params: undefined },
			{ path: "/docs", params: undefined },
		]);
	});

	test("torp-style wrapped endpoints fall back to the site flag", async () => {
		const router = new Router();
		// A .torp component is wrapped by the manifest as { component } only
		router.addPage("/posts/[id]", PAGE_ROUTE, async () => ({ default: { component: () => {} } }));
		router.addPage("/posts/[id]/~server", PAGE_SERVER_ROUTE, serverFlag({ params: [{ id: "1" }] }));

		const result = await resolvePrerenderPaths(routesOf(router), { "/posts/**": true });
		expect(result).toEqual([{ path: "/posts/1", params: { id: "1" } }]);
	});

	test("the error page route is never prerendered as a page", async () => {
		const router = new Router();
		router.addPage("/_error", ERROR_ROUTE, pageFlag(true));
		const result = await resolvePrerenderPaths(routesOf(router), true);
		expect(result).toEqual([]);
	});
});
