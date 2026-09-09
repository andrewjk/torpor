import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import path from "node:path";
import { beforeAll, expect, test } from "vite-plus/test";

const site: Site = new Site();
site.root = path.join(import.meta.dirname, "..");
site.adapter = node;

beforeAll(() => {
	// Mirror the route defined in site.config.ts
	site.addRoute("/", {
		page: "./src/Counter.torp",
	});
});

test("renders the counter page", async () => {
	const response = await runTest(site, "/");
	expect(response.status).toBe(200);

	const html = await response.text();
	const div = document.createElement("div");
	div.innerHTML = html;

	expect(queryByText(div, "Micro Site")).not.toBeNull();
	expect(queryByText(div, "The count is 0.")).not.toBeNull();
});

test("unknown routes redirect to the error page", async () => {
	const response = await runTest(site, "/nope");
	expect(response.status).toBe(303);
	expect(response.headers.get("location")).toContain("/_error?");
	expect(response.headers.get("location")).toContain("status=404");
});
