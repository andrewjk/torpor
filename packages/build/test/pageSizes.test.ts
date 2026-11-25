import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, expect, test } from "vite-plus/test";
import pageSizes, { formatPageSizes, overBudget } from "../src/run/pageSizes";
import { LAYOUT_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

// A client output folder with chunks of known sizes
const folder = mkdtempSync(path.join(os.tmpdir(), "torp-page-sizes-"));
mkdirSync(path.join(folder, "assets"));
const chunk = (name: string, size: number) =>
	writeFileSync(path.join(folder, "assets", name), "x".repeat(size));
chunk("entry.js", 1000);
chunk("layout.js", 2000);
chunk("docsLayout.js", 3000);
chunk("docs.js", 4000);
chunk("home.js", 500);
afterAll(() => rmSync(folder, { recursive: true }));

const preloads = {
	entry: ["/assets/entry.js"],
	routes: {
		"/_layout": ["/assets/layout.js"],
		"/docs/_layout": ["/assets/docsLayout.js"],
		"/docs": ["/assets/docs.js"],
		"/": ["/assets/home.js"],
	},
};

const routes = [
	{ path: "/_layout", type: LAYOUT_ROUTE },
	{ path: "/docs/_layout", type: LAYOUT_ROUTE },
	{ path: "/docs", type: PAGE_ROUTE },
	{ path: "/docs/~server", type: PAGE_SERVER_ROUTE },
	{ path: "/", type: PAGE_ROUTE },
];

test("each page counts the entry's, its layouts' and its own chunks, heaviest first", () => {
	const pages = pageSizes(preloads, routes, folder);
	expect(pages.map((page) => [page.path, page.files, page.raw])).toEqual([
		["/docs", 4, 10000],
		["/", 3, 3500],
	]);
	// Gzipped sizes are measured from the files
	expect(pages[0].gzip).toBeGreaterThan(0);
	expect(pages[0].gzip).toBeLessThan(pages[0].raw);
});

test("the report lists the pages, and the ones over budget", () => {
	const pages = [
		{ path: "/docs", files: 4, raw: 300_000, gzip: 120_000 },
		{ path: "/", files: 3, raw: 90_000, gzip: 30_000 },
	];
	const report = formatPageSizes(pages, { js: 100_000 });
	expect(report).toMatch(/\/docs +120\.0 kB +\(300\.0 kB raw, 4 files\)/);
	expect(report).toContain("1 page is over the 100.0 kB JavaScript budget");
	expect(report).toContain("(+20.0 kB)");
	expect(overBudget(pages, { js: 100_000 }).map((page) => page.path)).toEqual(["/docs"]);
	expect(formatPageSizes(pages, { js: 200_000 })).toContain("within the 200.0 kB budget");
	expect(overBudget(pages, undefined)).toEqual([]);
});

test("a long list is cut to the heaviest pages", () => {
	const pages = Array.from({ length: 15 }, (_, i) => ({
		path: `/p${i}`,
		files: 1,
		raw: 2000 - i,
		gzip: 1000 - i,
	}));
	const report = formatPageSizes(pages, undefined);
	expect(report).toContain("/p9");
	expect(report).not.toContain("/p10 ");
	expect(report).toContain("...and 5 more pages, down to 1.0 kB (/p14)");
});
