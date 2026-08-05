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

	// A hook that we can verify was *not* called for unmatched paths
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/_hook.server.ts"),
		`
		export default {};
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

	test("returns 404 for an unknown route", async () => {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");

		const res = await runTest(site, "/no-such-path");
		expect(res.status).toBe(404);
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
});
