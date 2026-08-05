import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import { ServerEvent } from "@torpor/build/server";
import { beforeAll, expect, test } from "vite-plus/test";

import addRoutes from "../src/routes";

const site: Site = new Site();
site.adapter = node;

beforeAll(() => {
	addRoutes(site);
});

test("renders the counter page", async () => {
	const response = await runTest(site, "/");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	const title = queryByText(div, "The count is 0.");
	expect(title).not.toBeNull();
});

test("server action returns a response", async () => {
	const req = new Request("http://localhost/?set", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: "count=42",
	});
	const ev = new ServerEvent(req);

	const response = await runTest(site, "/", ev);
	expect(response.status).toBe(200);

	const json = await response.json();
	expect(json.message).toBe("Server received count: 42");
});
