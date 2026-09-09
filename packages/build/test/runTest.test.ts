import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Site from "../src/site/Site";
import runTest from "../src/test/runTest";

let tmpRoot = "";

beforeAll(async () => {
	tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-runtest-test-"));
	await fs.mkdir(path.join(tmpRoot, "src/routes"), { recursive: true });

	// A simple GET /+server.ts that returns JSON
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/+server.ts"),
		`
		export default {
			get: () => Response.json({ hello: "world" }),
		};
		`,
	);

	// A simple GET /about/+server.ts that echoes a cookie
	await fs.mkdir(path.join(tmpRoot, "src/routes/about"), { recursive: true });
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/about/+server.ts"),
		`
		export default {
			get: (ev) => Response.json({ cookie: ev.cookies.get("session") }),
		};
		`,
	);

	// A simple page /page/+page.ts with an inline component
	await fs.mkdir(path.join(tmpRoot, "src/routes/page"), { recursive: true });
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/page/+page.ts"),
		`
		export default {
			component: () => ({ body: "<p>page</p>", head: "" }),
		};
		`,
	);

	// A page /greet/[name]/+page.ts whose client load echoes the params and
	// data it received, rendered into the body by the component
	await fs.mkdir(path.join(tmpRoot, "src/routes/greet/[name]"), { recursive: true });
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/greet/[name]/+page.ts"),
		`
		export default {
			component: ($props) => ({
				body: "<p>" + JSON.stringify($props.data) + "</p>",
				head: "",
			}),
			load: (ev) => Response.json({ gotParams: ev.params, gotData: ev.data }),
		};
		`,
	);

	// A hook that records enter/exit calls on a global, so tests can verify
	// when it did and didn't run. Setting __hookRedirect makes it
	// short-circuit the request with a redirect response
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/_hook.server.ts"),
		`
		export default {
			enter: (ev) => {
				(globalThis.__hookCalls ??= []).push("enter:" + ev.url.pathname);
				if (globalThis.__hookRedirect) {
					return new Response(null, { status: 302, headers: { location: "/login" } });
				}
			},
			exit: (ev) => {
				(globalThis.__hookCalls ??= []).push("exit:" + ev.url.pathname);
			},
		};
		`,
	);

	// A nested hook, to verify that hooks compose from the root down
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/about/_hook.server.ts"),
		`
		export default {
			enter: (ev) => {
				(globalThis.__hookCalls ??= []).push("leaf-enter:" + ev.url.pathname);
			},
			exit: (ev) => {
				(globalThis.__hookCalls ??= []).push("leaf-exit:" + ev.url.pathname);
			},
		};
		`,
	);

	// A GET /error/+server.ts whose handler throws
	await fs.mkdir(path.join(tmpRoot, "src/routes/error"), { recursive: true });
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/error/+server.ts"),
		`
		export default {
			get: () => {
				throw new Error("handler boom");
			},
		};
		`,
	);
});

afterAll(async () => {
	if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("runTest", () => {
	test("a +server.ts GET returns the response", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const res = await runTest(site, "/");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ hello: "world" });
	});

	test("cookies on a supplied ServerEvent are passed through", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const req = new Request("http://localhost/about", {
			headers: { cookie: "session=abc" },
		});
		const ev = new ServerEvent(req);
		const res = await runTest(site, "/about", ev);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ cookie: "abc" });
	});

	test("redirects an unknown route to the error page", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const res = await runTest(site, "/no-such-path");
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toContain("/_error?");
		expect(res.headers.get("location")).toContain("status=404");
	});

	test("default `route` argument creates a server event when none is supplied", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		// Passing no ev should still work — internally runTest builds a
		// ServerEvent from the route URL.
		const res = await runTest(site, "/");
		expect(res.ok).toBe(true);
	});

	test("supplied ServerEvent is honored over the default", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const req = new Request("http://test.example/about", {
			headers: { cookie: "session=xyz" },
		});
		const ev = new ServerEvent(req);
		const res = await runTest(site, "/about", ev);
		expect(await res.json()).toEqual({ cookie: "xyz" });
	});

	test("client load receives route params and accumulated data", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const res = await runTest(site, "/greet/world");
		expect(res.status).toBe(200);
		const html = await res.text();
		// The client load echoes what it was given: params from the URL and
		// the (still empty) data accumulated by the layouts above
		expect(html).toContain(JSON.stringify({ gotParams: { name: "world" }, gotData: {} }));
	});

	test("runs hook enter before and exit after the handler", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		const res = await runTest(site, "/");
		expect(res.status).toBe(200);
		expect((globalThis as any).__hookCalls).toEqual(["enter:/", "exit:/"]);
	});

	test("does not run the hook for unmatched paths", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		const res = await runTest(site, "/no-such-path");
		expect(res.status).toBe(303);
		expect((globalThis as any).__hookCalls).toEqual([]);
	});

	test("runs hook exit even when the handler throws", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		await expect(runTest(site, "/error")).rejects.toThrow("handler boom");
		expect((globalThis as any).__hookCalls).toEqual(["enter:/error", "exit:/error"]);
	});

	test("hook enter can short-circuit an endpoint with a response", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		(globalThis as any).__hookRedirect = true;
		try {
			const res = await runTest(site, "/");
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe("/login");
			// The handler was skipped, but exit still ran
			expect((globalThis as any).__hookCalls).toEqual(["enter:/", "exit:/"]);
		} finally {
			(globalThis as any).__hookRedirect = false;
		}
	});

	test("hook enter can short-circuit page rendering with a response", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		(globalThis as any).__hookRedirect = true;
		try {
			const res = await runTest(site, "/page");
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe("/login");
			// The load and component render were skipped, but exit still ran
			expect((globalThis as any).__hookCalls).toEqual(["enter:/page", "exit:/page"]);
		} finally {
			(globalThis as any).__hookRedirect = false;
		}
	});

	test("nested hooks run from the root down and exit in reverse", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		const res = await runTest(site, "/about");
		expect(res.status).toBe(200);
		expect((globalThis as any).__hookCalls).toEqual([
			"enter:/about",
			"leaf-enter:/about",
			"leaf-exit:/about",
			"exit:/about",
		]);
	});

	test("a hook short-circuit skips later hooks", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		(globalThis as any).__hookCalls = [];
		(globalThis as any).__hookRedirect = true;
		try {
			const res = await runTest(site, "/about");
			expect(res.status).toBe(302);
			// The leaf hook never ran; the root hook's exit did
			expect((globalThis as any).__hookCalls).toEqual(["enter:/about", "exit:/about"]);
		} finally {
			(globalThis as any).__hookRedirect = false;
		}
	});
});
