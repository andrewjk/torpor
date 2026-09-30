import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { electron } from "@torpor/adapter-electron";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import path from "node:path";
import { beforeAll, expect, test } from "vite-plus/test";

import addRoutes from "../src/routes";

const site: Site = new Site();
site.root = path.join(import.meta.dirname, "..");
site.adapter = electron();

beforeAll(() => {
	addRoutes(site);
});

test("renders the app page wrapped in the layout", async () => {
	const response = await runTest(site, "/");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	expect(queryByText(div, "Torpor Desktop")).not.toBeNull();
	expect(queryByText(div, "Hello from Torpor")).not.toBeNull();
});

test("the info endpoint runs in the server (Node) runtime", async () => {
	const response = await runTest(site, "/api/info");
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toContain("application/json");

	const json = await response.json();
	expect(typeof json.pid).toBe("number");
	expect(typeof json.platform).toBe("string");
	expect(json.node.startsWith("v")).toBe(true);
});
