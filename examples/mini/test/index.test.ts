import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import { beforeAll, expect, test } from "vite-plus/test";

import addRoutes from "../src/routes";

const site: Site = new Site();
site.adapter = node;

beforeAll(() => {
	addRoutes(site);
});

test("index", async () => {
	const response = await runTest(site, "/");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	const title = queryByText(div, "The count is 0.");
	expect(title).not.toBeNull();
});
