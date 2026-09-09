import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import { ServerEvent } from "@torpor/build/server";
import path from "node:path";
import { beforeAll, expect, test } from "vite-plus/test";

import addRoutes from "../src/routes";

const site: Site = new Site();
site.root = path.join(import.meta.dirname, "..");
site.adapter = node;

beforeAll(() => {
	addRoutes(site);
});

test("renders the counter page wrapped in the layout", async () => {
	const response = await runTest(site, "/");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	// Layout header
	expect(queryByText(div, "Mini Site")).not.toBeNull();
	// Page content
	expect(queryByText(div, "The count is 0.")).not.toBeNull();
});

test("server action returns a response", async () => {
	const req = new Request("http://localhost/?set", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			// Simulate a form submit from javascript, so the action's response
			// is returned as-is rather than re-rendering the view
			"X-Torpor-Form-Submit": "",
		},
		body: "count=42",
	});
	const ev = new ServerEvent(req);

	const response = await runTest(site, "/", ev);
	expect(response.status).toBe(200);

	const json = await response.json();
	expect(json.message).toBe("Server received count: 42");
});

test("+server endpoint returns JSON", async () => {
	const response = await runTest(site, "/api/time");
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toContain("application/json");

	const json = await response.json();
	expect(typeof json.time).toBe("number");
});

test("error page renders with status and message", async () => {
	const response = await runTest(site, "/_error?status=404&message=Not+found");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	expect(queryByText(div, "Error 404")).not.toBeNull();
	expect(queryByText(div, "Not found")).not.toBeNull();
});
