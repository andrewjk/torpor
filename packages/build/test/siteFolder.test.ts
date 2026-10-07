import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import Site from "../src/site/Site";

const root = path.join(import.meta.dirname, "..");

test("site routes", async () => {
	let site = new Site();
	site.root = root;
	await site.addRouteFolder("./test/routes");
	expect(site.routes.map((r) => r.path).join("\n")).toBe(
		`
/
/_error
/_hook/~server
/_layout
/_layout/~server
/~server
/posts
/posts/[id]
`.trim(),
	);
});

test("site routes with base folder", async () => {
	let site = new Site();
	site.root = root;
	await site.addRouteFolder("./test/routes");
	await site.addRouteFolder("./test/api", "api");
	expect(site.routes.map((r) => r.path).join("\n")).toBe(
		`
/
/_error
/_hook/~server
/_layout
/_layout/~server
/~server
/api/_hook/~server
/api/posts/~server
/api/posts/[id]/~server
/posts
/posts/[id]
`.trim(),
	);
});

test("addRouteFolder records the route folders", async () => {
	const site = new Site();
	site.root = root;
	await site.addRouteFolder("./test/routes");
	await site.addRouteFolder("./test/api", "api");
	expect(site.routeFolders).toEqual([
		{ folder: "./test/routes", subFolder: undefined },
		{ folder: "./test/api", subFolder: "/api" },
	]);
});

describe("applyRouteState", () => {
	let tmpRoot = "";

	beforeAll(async () => {
		tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-routes-test-"));
		await fs.mkdir(path.join(tmpRoot, "src/routes/about"), { recursive: true });
		await fs.writeFile(path.join(tmpRoot, "src/routes/+page.ts"), "");
		await fs.writeFile(path.join(tmpRoot, "src/routes/about/+page.ts"), "");
	});

	afterAll(async () => {
		if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
	});

	async function load(): Promise<Site> {
		const site = new Site();
		site.root = tmpRoot;
		await site.addRouteFolder("src/routes");
		return site;
	}

	test("returns false and keeps state when the route table is unchanged", async () => {
		const live = await load();
		const fresh = await load();
		expect(live.applyRouteState(fresh)).toBe(false);
		expect(live.routes.map((r) => r.path)).toEqual(fresh.routes.map((r) => r.path));
	});

	test("returns true and adopts added routes", async () => {
		const live = await load();

		await fs.mkdir(path.join(tmpRoot, "src/routes/contact"), { recursive: true });
		await fs.writeFile(path.join(tmpRoot, "src/routes/contact/+page.ts"), "");
		const fresh = await load();

		expect(live.applyRouteState(fresh)).toBe(true);
		expect(live.routes.map((r) => r.path)).toContain("/contact");

		await fs.rm(path.join(tmpRoot, "src/routes/contact"), { recursive: true, force: true });
	});

	test("returns true and drops removed routes", async () => {
		const live = await load();
		expect(live.routes.map((r) => r.path)).toContain("/about");

		await fs.rm(path.join(tmpRoot, "src/routes/about"), { recursive: true, force: true });
		const fresh = await load();

		expect(live.applyRouteState(fresh)).toBe(true);
		expect(live.routes.map((r) => r.path)).not.toContain("/about");

		await fs.mkdir(path.join(tmpRoot, "src/routes/about"), { recursive: true });
		await fs.writeFile(path.join(tmpRoot, "src/routes/about/+page.ts"), "");
	});

	test("copies route folders, inline endpoints and middleware", async () => {
		const live = await load();

		const fresh = await load();
		fresh.addRoute("/health", { server: { get: async () => undefined } });
		fresh.middleware = [{ enter: async () => undefined }];

		expect(live.applyRouteState(fresh)).toBe(true);
		expect(live.routes.map((r) => r.path)).toContain("/health");
		expect(live.inlineEndPoints["/health:3"]).toBeDefined();
		expect(live.middleware).toHaveLength(1);
		expect(live.routeFolders).toEqual(fresh.routeFolders);
	});
});
