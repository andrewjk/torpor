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

beforeAll(async () => {
	await site.addRouteFolder("./src/routes");
});

test("index", async () => {
	const response = await runTest(site, "/");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	const title = queryByText(div, "Basic reactivity");
	expect(title).not.toBeNull();
});
