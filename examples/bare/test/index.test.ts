import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import path from "node:path";
import { beforeAll, expect, test } from "vite-plus/test";

import addRoutes from "../src/routes";

const site: Site = new Site();
site.root = path.join(import.meta.dirname, "..");
site.adapter = node;

beforeAll(() => {
	addRoutes(site);
});

test("endpoint returns JSON without any site.html", async () => {
	const response = await runTest(site, "/");
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toContain("application/json");

	const json = await response.json();
	expect(typeof json.time).toBe("number");
});

test("unknown routes return not found", async () => {
	const response = await runTest(site, "/nope");
	expect(response.status).toBe(404);
});
