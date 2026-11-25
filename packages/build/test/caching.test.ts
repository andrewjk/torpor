import { describe, expect, test, vi } from "vite-plus/test";
import { DATA_REQUEST_HEADER } from "../src/dataRequest";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import dedupe from "../src/server/dedupe";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import {
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
} from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type ServerHook from "../src/types/ServerHook";
import type ServerLoadEvent from "../src/types/ServerLoadEvent";

const template = "<html><head></head><body>%COMPONENT_BODY%</body></html>";

const page = ($props: { data: any }) => ({
	body: `<p>${JSON.stringify($props.data)}</p>`,
	head: "",
});
const layout = async (_: unknown, $context: any, slots: any) => ({
	body: `<main>${await slots._(undefined, $context)}</main>`,
	head: "",
});

/** A site with a root layout and a /page, each with a server load. */
function site(options: {
	layoutLoad?: PageServerEndPoint["load"];
	pageLoad: PageServerEndPoint["load"];
	hook?: ServerHook;
}): ReturnType<typeof createServerLoad> {
	const routes: ManifestRoute[] = [
		{
			path: "/_layout",
			type: LAYOUT_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: layout } }),
			subFolder: undefined,
		},
		{
			path: "/_layout/~server",
			type: LAYOUT_SERVER_ROUTE,
			endPoint: () =>
				Promise.resolve({ default: { load: options.layoutLoad ?? (async () => ok({})) } }),
			subFolder: undefined,
		},
		{
			path: "/page",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component: page } }),
			subFolder: undefined,
		},
		{
			path: "/page/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { load: options.pageLoad } }),
			subFolder: undefined,
		},
	];
	if (options.hook) {
		routes.unshift({
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: options.hook }),
			subFolder: undefined,
		});
	}
	return createServerLoad(new Router().addPages(routes));
}

function get(path: string, headers: Record<string, string> = {}): ServerEvent {
	return new ServerEvent(new Request(`http://localhost${path}`, { headers }));
}

function data(path: string, headers: Record<string, string> = {}): ServerEvent {
	return get(path, { [DATA_REQUEST_HEADER]: "1", ...headers });
}

describe("dedupe", () => {
	test("runs once per request for the same arguments", async () => {
		const fetchUser = vi.fn(async (_: ServerLoadEvent, id: string) => ({ id }));
		const getUser = dedupe(fetchUser);
		const load = site({
			layoutLoad: async (ev) => ok({ user: await getUser(ev, "alice") }),
			pageLoad: async (ev) =>
				ok({ again: await getUser(ev, "alice"), other: await getUser(ev, "bob") }),
		});

		await load(get("/page"), template);
		expect(fetchUser).toHaveBeenCalledTimes(2);
		expect(fetchUser.mock.calls.map((call) => call[1])).toEqual(["alice", "bob"]);

		// Nothing is kept for the next request
		await load(get("/page"), template);
		expect(fetchUser).toHaveBeenCalledTimes(4);
	});

	test("doesn't keep a rejection, so a later call retries", async () => {
		let calls = 0;
		const flaky = dedupe(async () => {
			calls++;
			if (calls === 1) throw new Error("boom");
			return "ok";
		});
		const ev = get("/page");
		await expect(flaky(ev)).rejects.toThrow("boom");
		expect(await flaky(ev)).toBe("ok");
		expect(await flaky(ev)).toBe("ok");
		expect(calls).toBe(2);
	});
});

describe("cache headers", () => {
	test("a page without cache settings or cookies gets no Cache-Control", async () => {
		const load = site({ pageLoad: async () => ok({ a: 1 }) });
		const res = await load(get("/page"), template);
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBeNull();
	});

	test("event.cache sets Cache-Control, merging layout and page settings", async () => {
		const load = site({
			layoutLoad: async (ev) => {
				ev.cache({ maxAge: 300, sMaxAge: 600, vary: ["Accept-Language"] });
				return ok({});
			},
			pageLoad: async (ev) => {
				ev.cache({ maxAge: 60, staleWhileRevalidate: 30 });
				return ok({});
			},
		});
		const res = await load(get("/page"), template);
		expect(res.headers.get("Cache-Control")).toBe(
			"public, max-age=60, s-maxage=600, stale-while-revalidate=30",
		);
		expect(res.headers.get("Vary")).toBe("Accept-Language");
	});

	test("a page that reads the session is private by default", async () => {
		const load = site({
			hook: {
				enter: async (ev) => {
					ev.appData.user = await ev.session.get();
				},
			},
			pageLoad: async () => ok({}),
		});
		const res = await load(get("/page"), template);
		expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
	});

	test("cache settings on a cookie-reading page stay private unless it opts out", async () => {
		const reading = (privateFlag?: boolean) =>
			site({
				pageLoad: async (ev) => {
					ev.cookies.get("theme");
					ev.cache({ maxAge: 60, sMaxAge: 600, private: privateFlag });
					return ok({});
				},
			});
		const res = await reading()(get("/page"), template);
		// Private, so the shared-cache age is dropped
		expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");

		const optedOut = await reading(false)(get("/page"), template);
		expect(optedOut.headers.get("Cache-Control")).toBe("public, max-age=60, s-maxage=600");
	});

	test("a Cache-Control set through event.headers wins", async () => {
		const load = site({
			pageLoad: async (ev) => {
				ev.headers.set("Cache-Control", "no-store");
				ev.cache({ maxAge: 60 });
				ev.cookies.get("theme");
				return ok({});
			},
		});
		const res = await load(get("/page"), template);
		expect(res.headers.get("Cache-Control")).toBeNull();
		// (event.headers are appended to the response by the Server, after this)
		expect(res.headers.get("ETag")).toMatch(/^W\//);
	});

	test("an error response doesn't get the cache settings", async () => {
		const load = site({
			pageLoad: async (ev) => {
				ev.cache({ maxAge: 60 });
				return new Response("nope", { status: 500 });
			},
		});
		const res = await load(get("/page"), template);
		expect(res.status).toBe(500);
		expect(res.headers.get("Cache-Control")).toBeNull();
	});
});

describe("etags", () => {
	test("a data response has an ETag, and a matching request gets a 304", async () => {
		let value = 1;
		const load = site({ pageLoad: async () => ok({ value }) });

		const first = await load(data("/page/~server"), template);
		expect(first.status).toBe(200);
		const etag = first.headers.get("ETag")!;
		expect(etag).toMatch(/^W\/"/);
		expect(first.headers.get("Cache-Control")).toBe("no-cache");
		expect(first.headers.get("Vary")).toContain(DATA_REQUEST_HEADER);

		const again = await load(data("/page/~server", { "If-None-Match": etag }), template);
		expect(again.status).toBe(304);
		expect(await again.text()).toBe("");
		expect(again.headers.get("ETag")).toBe(etag);

		// The loads ran again, and changed data is sent
		value = 2;
		const changed = await load(data("/page/~server", { "If-None-Match": etag }), template);
		expect(changed.status).toBe(200);
		expect((await changed.json()).loads[1]).toEqual({ value: 2 });
	});

	test("a page's HTML has an ETag from its content", async () => {
		const load = site({ pageLoad: async () => ok({ a: 1 }) });
		const first = await load(get("/page"), template);
		const etag = first.headers.get("ETag")!;
		expect(etag).toMatch(/^W\/"/);

		const again = await load(get("/page", { "If-None-Match": etag }), template);
		expect(again.status).toBe(304);
	});

	test("a private data response stays private on a 304", async () => {
		const load = site({
			pageLoad: async (ev) => ok({ user: (await ev.session.get()) ?? null }),
		});
		const first = await load(data("/page/~server"), template);
		expect(first.headers.get("Cache-Control")).toBe("private, no-cache");
		const again = await load(
			data("/page/~server", { "If-None-Match": first.headers.get("ETag")! }),
			template,
		);
		expect(again.status).toBe(304);
		expect(again.headers.get("Cache-Control")).toBe("private, no-cache");
	});
});

describe("waitUntil", () => {
	test("hands the work to the adapter's ctx.waitUntil", async () => {
		const waitUntil = vi.fn();
		const ev = get("/page");
		ev.adapter = { ctx: { waitUntil } };
		ev.waitUntil(Promise.resolve("done"));
		expect(waitUntil).toHaveBeenCalledTimes(1);
	});

	test("logs a rejection rather than leaving it unhandled", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const ev = get("/page");
			ev.waitUntil(Promise.reject(new Error("bg boom")));
			await new Promise((resolve) => setTimeout(resolve));
			expect(error).toHaveBeenCalledWith("[torpor] Background work failed:", expect.any(Error));
		} finally {
			error.mockRestore();
		}
	});
});
