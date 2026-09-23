import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import runPrerender, { expandPath, resolvePrerenderPaths } from "../src/run/runPrerender";
import Router from "../src/site/Router";
import Site from "../src/site/Site";
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

/**
 * Sets up a fake built site (dist/server/serverEntry.js plus the template
 * and assets runPrerender expects), with the error page served by the given
 * handler.
 */
async function writeFakeDist(root: string, errorLoad: string): Promise<void> {
	await fs.mkdir(path.join(root, "dist", "server"), { recursive: true });
	await fs.mkdir(path.join(root, "dist", "client", "assets"), { recursive: true });
	await fs.writeFile(path.join(root, "dist", "client", "assets", "clientEntry-abc123.js"), "");
	await fs.writeFile(
		path.join(root, "dist", "client", "site.html"),
		'<html><head></head><body><div id="app"></div></body></html>',
	);
	await fs.writeFile(
		path.join(root, "dist", "server", "serverEntry.js"),
		`
		export const router = {
			routes: [{ path: "/_error", handler: { path: "/_error", type: 8 } }],
		};
		export async function load(ev, template) {
			const url = new URL(ev.request.url);
			if (url.pathname !== "/_error") {
				return new Response("<p>page</p>", { headers: { "Content-Type": "text/html" } });
			}
			${errorLoad}
		}
		`,
	);
}

describe("runPrerender error pages", () => {
	let tmpRoot = "";

	beforeAll(async () => {
		tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-prerender-test-"));
	});

	afterAll(async () => {
		if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
	});

	test("writes 404.html and 500.html when the site has an error page", async () => {
		const root = path.join(tmpRoot, "writes");
		await writeFakeDist(
			root,
			`const status = parseInt(url.searchParams.get("status") ?? "404");
			 return new Response("<p>error " + status + "</p>", { status, headers: { "Content-Type": "text/html" } });`,
		);
		const site = new Site();
		site.root = root;

		const written = await runPrerender(site);

		// Page entries and error pages are counted separately
		expect(written).toBe(0);
		expect(await fs.readFile(path.join(root, "dist", "client", "404.html"), "utf-8")).toContain(
			"error 404",
		);
		expect(await fs.readFile(path.join(root, "dist", "client", "500.html"), "utf-8")).toContain(
			"error 500",
		);
	});

	test("skips both error pages when the layout redirects", async () => {
		const root = path.join(tmpRoot, "redirects");
		await writeFakeDist(
			root,
			`return new Response(null, { status: 303, headers: { location: "/setup" } });`,
		);
		const site = new Site();
		site.root = root;

		await runPrerender(site);

		await expect(
			fs.readFile(path.join(root, "dist", "client", "404.html"), "utf-8"),
		).rejects.toThrow();
		await expect(
			fs.readFile(path.join(root, "dist", "client", "500.html"), "utf-8"),
		).rejects.toThrow();
	});
});
