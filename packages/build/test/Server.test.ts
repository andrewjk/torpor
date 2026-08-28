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
		const result = s.use({});
		expect(result).toBe(s);
	});

	test("use appends to middleware without mutating the original array", () => {
		const s = new Server();
		const mw = { enter: () => {} };
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

	test("runs enter hooks before and exit hooks after the route handler", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use({
			enter: async () => {
				order.push("mw1-enter");
			},
			exit: async () => {
				order.push("mw1-exit");
			},
		});
		s.use({
			enter: async () => {
				order.push("mw2-enter");
			},
			exit: async () => {
				order.push("mw2-exit");
			},
		});
		s.add("/x", async () => {
			order.push("handler");
			return new Response("ok");
		});
		await s.fetch("https://example.com/x");
		expect(order).toEqual(["mw1-enter", "mw2-enter", "handler", "mw2-exit", "mw1-exit"]);
	});

	test("middleware can short-circuit by returning a response", async () => {
		const s = new Server();
		s.use({
			enter: () => new Response("blocked", { status: 403 }),
		});
		s.add("/x", async () => new Response("should-not-run"));
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(403);
		expect(await res.text()).toBe("blocked");
	});

	test("setting ev.response without returning does not short-circuit", async () => {
		const s = new Server();
		s.use({
			enter: (ev) => {
				ev.response = new Response("ignored", { status: 403 });
			},
		});
		s.add("/x", async () => new Response("ok"));
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("ok");
	});

	test("exit hooks of entered middleware run after a short-circuit", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use({
			enter: () => {
				order.push("mw1-enter");
				return new Response("blocked", { status: 403 });
			},
			exit: () => {
				order.push("mw1-exit");
			},
		});
		s.use({
			enter: () => {
				order.push("mw2-enter");
			},
			exit: () => {
				order.push("mw2-exit");
			},
		});
		s.add("/x", () => {
			order.push("handler");
			return new Response("nope");
		});
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(403);
		expect(order).toEqual(["mw1-enter", "mw1-exit"]);
	});

	test("an exit hook can replace the response", async () => {
		const s = new Server();
		s.use({
			exit: () => new Response("replaced", { status: 202 }),
		});
		s.add("/x", () => new Response("original"));
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(202);
		expect(await res.text()).toBe("replaced");
	});

	test("exit hooks run even when the handler throws", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use({
			enter: () => {
				order.push("enter");
			},
			exit: () => {
				order.push("exit");
			},
		});
		s.add("/x", async () => {
			throw new Error("boom");
		});
		await expect(s.fetch("https://example.com/x")).rejects.toThrow("boom");
		expect(order).toEqual(["enter", "exit"]);
	});

	test("an exit hook can handle a handler error via ev.error", async () => {
		const s = new Server();
		s.use({
			exit: (ev) => {
				if (ev.error) {
					return new Response(`handled: ${(ev.error as Error).message}`, { status: 500 });
				}
			},
		});
		s.add("/x", async () => {
			throw new Error("boom");
		});
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(500);
		expect(await res.text()).toBe("handled: boom");
	});

	test("an exit hook can handle an error thrown by a later enter hook", async () => {
		const s = new Server();
		s.use({
			exit: (ev) => {
				if (ev.error) {
					return new Response("handled enter error", { status: 502 });
				}
			},
		});
		s.use({
			enter: () => {
				throw new Error("enter boom");
			},
		});
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(502);
		expect(await res.text()).toBe("handled enter error");
	});

	test("an enter hook error propagates when no exit hook handles it", async () => {
		const handlerRan: boolean[] = [];
		const s = new Server();
		s.use({
			enter: () => {
				throw new Error("enter boom");
			},
		});
		s.add("/x", () => {
			handlerRan.push(true);
			return new Response("nope");
		});
		await expect(s.fetch("https://example.com/x")).rejects.toThrow("enter boom");
		expect(handlerRan).toEqual([]);
	});

	test("an exit hook error propagates and skips remaining exit hooks", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use({
			exit: () => {
				order.push("mw1-exit");
			},
		});
		s.use({
			exit: () => {
				order.push("mw2-exit");
				throw new Error("exit boom");
			},
		});
		s.add("/x", () => new Response("ok"));
		await expect(s.fetch("https://example.com/x")).rejects.toThrow("exit boom");
		expect(order).toEqual(["mw2-exit"]);
	});

	test("supports middleware with only an exit hook", async () => {
		const order: string[] = [];
		const s = new Server();
		s.use({
			exit: () => {
				order.push("exit");
			},
		});
		s.add("/x", () => {
			order.push("handler");
			return new Response("ok");
		});
		const res = await s.fetch("https://example.com/x");
		expect(res.status).toBe(200);
		expect(order).toEqual(["handler", "exit"]);
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
