import { expect, test } from "vite-plus/test";
import Site from "../src/site/Site";
import {
	ERROR_ROUTE,
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../src/types/RouteType";

test("addRoute page + pageServer creates the expected routes", () => {
	const site = new Site();
	site.addRoute("/", {
		page: "./src/+page.torp",
		pageServer: { actions: { default: async () => undefined } },
	});

	const paths = site.routes.map((r) => ({ path: r.path, type: r.type }));
	expect(paths).toContainEqual({ path: "/", type: PAGE_ROUTE });
	expect(paths).toContainEqual({ path: "/~server", type: PAGE_SERVER_ROUTE });
});

test("addRoute with only server creates a +server route", () => {
	const site = new Site();
	site.addRoute("/api/time", {
		server: { get: async () => undefined },
	});

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].path).toBe("/api/time");
	expect(site.routes[0].type).toBe(SERVER_ROUTE);
});

test("addRoute layout creates a _layout route at the correct path", () => {
	const site = new Site();
	site.addRoute("/", { layout: "./src/Layout.torp" });
	site.addRoute("/posts", { layout: "./src/PostsLayout.torp" });

	const paths = site.routes.map((r) => ({ path: r.path, type: r.type }));
	expect(paths).toContainEqual({ path: "/_layout", type: LAYOUT_ROUTE });
	expect(paths).toContainEqual({ path: "/posts/_layout", type: LAYOUT_ROUTE });
});

test("addRoute layoutServer creates a _layout/~server route", () => {
	const site = new Site();
	site.addRoute("/", {
		layoutServer: { load: async () => undefined },
	});

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].path).toBe("/_layout/~server");
	expect(site.routes[0].type).toBe(LAYOUT_SERVER_ROUTE);
});

test("addRoute hookServer creates a _hook/~server route", () => {
	const site = new Site();
	site.addRoute("/", {
		hookServer: { handle: async () => undefined },
	});

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].path).toBe("/_hook/~server");
	expect(site.routes[0].type).toBe(HOOK_SERVER_ROUTE);
});

test("addRoute hookServer with subFolder", () => {
	const site = new Site();
	site.addRoute("/api", { hookServer: { handle: async () => undefined } }, "api");

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].path).toBe("/api/_hook/~server");
	expect(site.routes[0].subFolder).toBe("/api");
});

test("addRoute error creates an _error route", () => {
	const site = new Site();
	site.addRoute("/", { error: "./src/ErrorPage.torp" });

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].path).toBe("/_error");
	expect(site.routes[0].type).toBe(ERROR_ROUTE);
});

test("addRoute with all options in one call", () => {
	const site = new Site();
	site.addRoute("/", {
		page: "./src/+page.torp",
		pageServer: { actions: { default: async () => undefined } },
		server: { get: async () => undefined },
		layout: "./src/Layout.torp",
		layoutServer: { load: async () => undefined },
		error: "./src/ErrorPage.torp",
		hookServer: { handle: async () => undefined },
	});

	const paths = site.routes.map((r) => ({ path: r.path, type: r.type }));
	expect(paths).toContainEqual({ path: "/", type: PAGE_ROUTE });
	expect(paths).toContainEqual({ path: "/~server", type: PAGE_SERVER_ROUTE });
	expect(paths).toContainEqual({ path: "/", type: SERVER_ROUTE });
	expect(paths).toContainEqual({ path: "/_layout", type: LAYOUT_ROUTE });
	expect(paths).toContainEqual({ path: "/_layout/~server", type: LAYOUT_SERVER_ROUTE });
	expect(paths).toContainEqual({ path: "/_hook/~server", type: HOOK_SERVER_ROUTE });
	expect(paths).toContainEqual({ path: "/_error", type: ERROR_ROUTE });
});

test("addRoute stores inline endpoints in inlineEndPoints keyed by path:type", () => {
	const site = new Site();
	const pageServerEP = { actions: { default: async () => undefined } };
	const serverEP = { get: async () => undefined };
	const hookEP = { handle: async () => undefined };

	site.addRoute("/", {
		pageServer: pageServerEP,
		hookServer: hookEP,
	});
	site.addRoute("/api/data", {
		server: serverEP,
	});

	expect(site.inlineEndPoints["/~server:" + PAGE_SERVER_ROUTE]).toBe(pageServerEP);
	expect(site.inlineEndPoints["/_hook/~server:" + HOOK_SERVER_ROUTE]).toBe(hookEP);
	expect(site.inlineEndPoints["/api/data:" + SERVER_ROUTE]).toBe(serverEP);
});

test("addRoute file paths are resolved relative to site root", () => {
	const site = new Site();
	site.addRoute("/", {
		page: "./src/Counter.torp",
		layout: "./src/Layout.torp",
	});

	const page = site.routes.find((r) => r.type === PAGE_ROUTE);
	expect(page?.file).toBe("src/Counter.torp");

	const layout = site.routes.find((r) => r.type === LAYOUT_ROUTE);
	expect(layout?.file).toBe("src/Layout.torp");
});

test("addRoute with no page works (e.g. server-only)", () => {
	const site = new Site();
	site.addRoute("/health", { server: { get: async () => undefined } });

	expect(site.routes).toHaveLength(1);
	expect(site.routes[0].file).toBeUndefined();
	expect(site.routes[0].endPoint).toBeDefined();
});
