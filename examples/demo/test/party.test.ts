import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import { runTest } from "@torpor/build/test";
import { beforeAll, expect, test } from "vitest";

const site: Site = new Site();
site.adapter = node;

beforeAll(async () => {
	await site.addRouteFolder("./src/routes");
});

test("index", async () => {
	const response = await runTest(site, "/party");
	const html = await response.text();

	const div = document.createElement("div");
	div.innerHTML = html;

	const title = queryByText(div, "Declare state");
	expect(title).not.toBeNull();
});
