import { describe, expect, test } from "vite-plus/test";
import Server from "../src/server/Server";
import ServerEvent from "../src/server/ServerEvent";

describe("Server", () => {
	test("constructs with empty routes and middleware", () => {
		const s = new Server();
		expect(s.routes).toEqual([]);
		expect(s.middleware).toEqual([]);
	});

	test("add returns the server for chaining", () => {
		const s = new Server();
		const result = s.add("/x", () => undefined);
		expect(result).toBe(s);
	});

	test("add stores and sorts routes; param routes after static", () => {
		const s = new Server();
		s.add("/posts/[id]", () => undefined);
		s.add("/posts/drafts", () => undefined);
		// Sorting mirrors Site/Router: static routes precede param routes
		expect(s.routes.map((r) => r.path)).toEqual(["/posts/drafts", "/posts/[id]"]);
	});

	test("use returns the server for chaining", () => {
		const s = new Server();
		const result = s.use(async () => {});
		expect(result).toBe(s);
	});

	test("use appends to middleware without mutating the original array", () => {
		const s = new Server();
		const mw = async () => {};
		s.use(mw);
		expect(s.middleware).toHaveLength(1);
		expect(s.middleware[0]).toBe(mw);
	});

	test("match returns undefined for an unknown path", () => {
		const s = new Server();
		s.add("/known", () => undefined);
		expect(s.match("/unknown")).toBeUndefined();
	});

	test("match returns { fn, params } for a static path", () => {
		const s = new Server();
		const fn = () => undefined;
		s.add("/known", fn);
		const m = s.match("/known");
		expect(m).toBeDefined();
		expect(m!.fn).toBe(fn);
		expect(m!.params).toBeUndefined();
	});

	test("match captures named params", () => {
		const s = new Server();
		s.add("/posts/[id]", () => undefined);
		const m = s.match("/posts/5");
		expect(m?.params?.id).toBe("5");
	});

	test("match honors wildcard routes", () => {
		const s = new Server();
		s.add("*", () => undefined);
		expect(s.match("/anything")).toBeDefined();
		expect(s.match("/assets/foo.css")).toBeDefined();
	});
});

describe("Server.fetch", () => {
	test("returns 404 when no route matches", async () => {
		const s = new Server();
		const res = await s.fetch("https://example.com/nope");
		expect(res.status).toBe(404);
	});

	test("invokes the matched handler and returns its Response", async () => {
		const s = new Server();
		s.add("/hello", () => new Response("world"));
		const res = await s.fetch("https://example.com/hello");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("world");
	});

	test("defaults to 200 when handler returns void", async () => {
		const s = new Server();
		s.add("/silent", () => undefined);
		const res = await s.fetch("https://example.com/silent");
		expect(res.status).toBe(200);
	});

	test("passes URL params through to the handler via ServerEvent", async () => {
		const s = new Server();
		s.add("/posts/[id]", async (ev) => {
			return new Response(ev.params?.id ?? "");
		});
		const res = await s.fetch("https://example.com/posts/42");
		expect(await res.text()).toBe("42");
	});

	test("passes the request through to the handler via ServerEvent", async () => {
		const s = new Server();
		s.add("/echo", async (ev) => {
			return new Response(ev.request.method);
		});
		const res = await s.fetch("https://example.com/echo", { method: "POST" });
		expect(await res.text()).toBe("POST");
	});

	test("runs middleware before the route handler in order", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use(async (_ev, next) => {
			order.push("mw1-before");
			await next();
			order.push("mw1-after");
		});
		s.use(async (_ev, next) => {
			order.push("mw2-before");
			await next();
			order.push("mw2-after");
		});
		s.add("/x", async () => {
			order.push("handler");
			return new Response("ok");
		});
		await s.fetch("https://example.com/x");
		expect(order).toEqual(["mw1-before", "mw2-before", "handler", "mw2-after", "mw1-after"]);
	});

	test("middleware can short-circuit by setting ev.response", async () => {
		const s = new Server();
		s.use(async (ev) => {
			ev.response = new Response("blocked", { status: 403 });
		});
		s.add("/x", async () => new Response("should-not-run"));
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(403);
		expect(await res.text()).toBe("blocked");
	});

	test("cookies set on ev.cookies are appended to the response on addHeaders", async () => {
		const s = new Server();
		s.add("/login", async (ev) => {
			ev.cookies.set("session", "abc");
			return new Response("ok");
		});
		const res = await s.fetch("https://example.com/login");
		const setCookies = res.headers.getSetCookie?.() ?? [];
		expect(setCookies.length).toBeGreaterThan(0);
		expect(setCookies[0]).toMatch(/^session=abc/);
	});

	test("headers set on ev.headers are appended to the response on addHeaders", async () => {
		const s = new Server();
		s.add("/x", async (ev) => {
			ev.headers.set("x-custom", "value");
			return new Response("ok");
		});
		const res = await s.fetch("https://example.com/x");
		expect(res.headers.get("x-custom")).toBe("value");
	});
});

describe("ServerEvent", () => {
	test("exposes request, params, cookies, headers", () => {
		const req = new Request("https://example.com/x");
		const ev = new ServerEvent(req, { id: "1" });
		expect(ev.request).toBe(req);
		expect(ev.params).toEqual({ id: "1" });
		expect(ev.cookies).toBeDefined();
		expect(ev.headers).toBeDefined();
	});

	test("adapter is read from globalThis when set", () => {
		const g = globalThis as any;
		const prev = g.adapter;
		g.adapter = { platform: "test" };
		try {
			const ev = new ServerEvent(new Request("https://example.com/"));
			expect(ev.adapter).toEqual({ platform: "test" });
		} finally {
			if (prev === undefined) delete g.adapter;
			else g.adapter = prev;
		}
	});

	test("addHeaders throws when response is missing", () => {
		const ev = new ServerEvent(new Request("https://example.com/"));
		expect(() => ev.addHeaders()).toThrow(/Response not created/);
	});

	test("addHeaders appends Set-Cookie values", () => {
		const req = new Request("https://example.com/");
		const ev = new ServerEvent(req);
		ev.cookies.set("a", "1");
		ev.response = new Response(null);
		ev.addHeaders();
		const setCookies = ev.response.headers.getSetCookie?.() ?? [];
		expect(setCookies.length).toBe(1);
		expect(setCookies[0]).toMatch(/^a=1/);
	});
});
